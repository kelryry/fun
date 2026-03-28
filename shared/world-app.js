(async () => {
    if (typeof THREE === "undefined" || typeof SimplexNoise === "undefined") {
        console.error("Missing runtime dependencies for world app.");
        return;
    }

    const DEFAULT_RUNTIME = {
        app: {
            name: "lulu-world",
            version: "static",
            aiEnabled: false
        },
        performance: {
            targetFpsDesktop: 45,
            targetFpsMobile: 30,
            idleFps: 12
        }
    };

    function mergeRuntimeConfig(base, incoming) {
        return {
            ...base,
            ...incoming,
            app: {
                ...base.app,
                ...(incoming && incoming.app ? incoming.app : {})
            },
            performance: {
                ...base.performance,
                ...(incoming && incoming.performance ? incoming.performance : {})
            }
        };
    }

    async function loadRuntimeConfig() {
        const apiBase = document.body.dataset.apiBase || "/api";
        const controller = new AbortController();
        const timeoutId = window.setTimeout(() => controller.abort(), 1500);

        try {
            const response = await fetch(`${apiBase}/bootstrap`, {
                headers: { Accept: "application/json" },
                signal: controller.signal
            });

            if (!response.ok) {
                throw new Error(`Bootstrap request failed: ${response.status}`);
            }

            const payload = await response.json();
            return mergeRuntimeConfig(DEFAULT_RUNTIME, payload);
        } catch (error) {
            console.warn("Using local runtime defaults.", error);
            return DEFAULT_RUNTIME;
        } finally {
            window.clearTimeout(timeoutId);
        }
    }

    function getPerformanceProfile(runtime) {
        const deviceMemory = navigator.deviceMemory || 8;
        const hardwareConcurrency = navigator.hardwareConcurrency || 8;
        const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
        const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        const connection = navigator.connection || navigator.webkitConnection || navigator.mozConnection || null;
        const saveData = Boolean(connection && connection.saveData);
        const lowEnd = saveData || reducedMotion || deviceMemory <= 4 || hardwareConcurrency <= 4;
        const midEnd = !lowEnd && (coarsePointer || deviceMemory <= 6 || hardwareConcurrency <= 6);

        const profile = {
            coarsePointer,
            reducedMotion,
            lowEnd,
            targetFps: coarsePointer ? runtime.performance.targetFpsMobile : runtime.performance.targetFpsDesktop,
            idleFps: runtime.performance.idleFps,
            maxDpr: lowEnd ? 0.9 : (midEnd ? 1.25 : 1.7),
            minDpr: lowEnd ? 0.6 : 0.75,
            antialias: !lowEnd,
            powerPreference: lowEnd || coarsePointer ? "low-power" : "high-performance",
            shadowEnabled: !lowEnd && !reducedMotion,
            shadowMapSize: lowEnd ? 0 : (midEnd ? 1024 : 2048),
            terrainRes: lowEnd ? 144 : (midEnd ? 192 : 256),
            waterRes: lowEnd ? 48 : (midEnd ? 72 : 128),
            objectAttempts: lowEnd ? 650 : (midEnd ? 980 : 1400),
            cloudCount: lowEnd ? 16 : (midEnd ? 24 : 40),
            viewDistance: lowEnd ? 700 : (midEnd ? 800 : 900),
            lowEffects: lowEnd || reducedMotion
        };

        if (reducedMotion) {
            profile.targetFps = Math.min(profile.targetFps, 24);
            profile.idleFps = Math.min(profile.idleFps, 8);
            profile.cloudCount = Math.min(profile.cloudCount, 12);
            profile.maxDpr = Math.min(profile.maxDpr, 1);
            profile.shadowEnabled = false;
        }

        return profile;
    }

    const runtime = await loadRuntimeConfig();
    const perf = getPerformanceProfile(runtime);
    const config = {
        chunkSize: 1600,
        res: perf.terrainRes,
        waterRes: perf.waterRes,
        viewDistance: perf.viewDistance,
        gravity: 50.0,
        speed: 18.0,
        runSpeed: 40.0,
        jumpForce: 25.0,
        eyeHeight: 3.0,
        minimapCamSize: 300,
        glideGravity: 5.0,
        glideSpeed: 25.0,
        objectAttempts: perf.objectAttempts,
        cloudCount: perf.cloudCount
    };

    document.body.classList.toggle("low-effects", perf.lowEffects);
    window.__WORLD_RUNTIME__ = runtime;

    let scene;
    let camera;
    let renderer;
    let controls;
    let mapCamera;

    const noise = new SimplexNoise();
    const moistureNoise = new SimplexNoise();

    const playerVelocity = new THREE.Vector3();
    const playerDirection = new THREE.Vector3();
    const tmpDir = new THREE.Vector3();

    let isGrounded = false;
    let isRunning = false;
    let isGliding = false;
    let stamina = 100;
    let gameActive = false;
    let pageVisible = !document.hidden;
    let animationFrameId = 0;
    let renderDpr = Math.min(window.devicePixelRatio || 1, perf.maxDpr);
    let baseDpr = renderDpr;
    let viewportW = window.innerWidth;
    let viewportH = window.innerHeight;
    let lastRenderNow = 0;
    let lastScaleNow = 0;
    let fpsSmoothed = 0;
    let lastFpsHudNow = 0;
    let hudCooldown = 0;
    let biomeCooldown = 0;
    let staminaUiCooldown = 0;
    let staminaUiLast = -1;
    let glideHintVisible = false;
    let elapsedTime = 0;

    let terrainMesh;
    let waterMesh;
    let cloudGroup;

    const obstacleGrid = new Map();
    const obstacleCellSize = 20;
    const obstacleGridOffset = 32768;
    const obstacleGridMask = 0xffff;

    let terrainPosArray = null;
    let terrainVertsPerRow = 0;
    let terrainRes = 0;
    let terrainSize = 0;
    let terrainHalfSize = 0;

    const minimapViewport = { x: 0, y: 0, w: 0, h: 0 };
    const keyState = { forward: false, backward: false, left: false, right: false };

    const ui = {
        staminaBar: document.getElementById("stamina-bar"),
        glideHint: document.getElementById("glide-hint"),
        biomeDisplay: document.getElementById("biome-display"),
        posDisplay: document.getElementById("pos-display"),
        minimapArrow: document.getElementById("minimap-arrow"),
        minimapContainer: document.getElementById("minimap-container"),
        fpsHud: document.getElementById("fps-hud"),
        pauseMenu: document.getElementById("pause-menu"),
        startBtn: document.getElementById("start-btn")
    };

    const Palette = {
        Water: new THREE.Color(0x40e0d0),
        Sky: new THREE.Color(0xa0d8ef),
        Sand: new THREE.Color(0xffcc80),
        GrassLight: new THREE.Color(0x90ee90),
        GrassDark: new THREE.Color(0x2e8b57),
        RockRed: new THREE.Color(0xcd5c5c),
        Snow: new THREE.Color(0xfffafa),
        TreeGreen: new THREE.Color(0x00a86b),
        TreePink: new THREE.Color(0xff69b4),
        Cactus: new THREE.Color(0x3cb371),
        Stone: new THREE.Color(0xa9a9a9)
    };

    const WaterShader = {
        uniforms: {
            time: { value: 0 },
            color: { value: Palette.Water },
            sunDirection: { value: new THREE.Vector3(0.5, 0.8, 0.3).normalize() }
        },
        vertexShader: `
            uniform float time;
            varying vec3 vPos;

            float random(vec2 st) {
                return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
            }

            void main() {
                vec3 pos = position;
                float wave1 = sin(pos.x * 0.05 + time * 1.2) * 0.8;
                float wave2 = cos(pos.z * 0.04 + time * 1.0) * 0.8;
                float noiseValue = random(pos.xz) * 0.2;
                pos.y += wave1 + wave2 + noiseValue;
                vPos = (modelMatrix * vec4(pos, 1.0)).xyz;
                gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(pos, 1.0);
            }
        `,
        fragmentShader: `
            uniform vec3 color;
            uniform vec3 sunDirection;
            varying vec3 vPos;

            void main() {
                vec3 dx = dFdx(vPos);
                vec3 dy = dFdy(vPos);
                vec3 normal = normalize(cross(dx, dy));
                float diff = max(dot(normal, sunDirection), 0.0);
                vec3 viewDir = normalize(cameraPosition - vPos);
                vec3 reflectDir = reflect(-sunDirection, normal);
                float spec = pow(max(dot(viewDir, reflectDir), 0.0), 40.0);
                vec3 deepColor = vec3(0.0, 0.4, 0.6);
                vec3 shallowColor = color + vec3(0.15);
                vec3 finalColor = mix(deepColor, shallowColor, diff * 0.5 + 0.5);
                finalColor += vec3(1.0) * spec * 0.7;
                gl_FragColor = vec4(finalColor, 0.4);
            }
        `
    };

    function obstacleKey(ix, iz) {
        return (((ix + obstacleGridOffset) & obstacleGridMask) << 16) | ((iz + obstacleGridOffset) & obstacleGridMask);
    }

    function addObstacle(x, z, r) {
        const ix = Math.floor(x / obstacleCellSize);
        const iz = Math.floor(z / obstacleCellSize);
        const key = obstacleKey(ix, iz);
        let cell = obstacleGrid.get(key);

        if (!cell) {
            cell = [];
            obstacleGrid.set(key, cell);
        }

        cell.push({ x, z, r });
    }

    function updateMinimapViewportCache() {
        viewportW = window.innerWidth;
        viewportH = window.innerHeight;

        if (!ui.minimapContainer) {
            minimapViewport.x = 0;
            minimapViewport.y = 0;
            minimapViewport.w = 0;
            minimapViewport.h = 0;
            return;
        }

        const rect = ui.minimapContainer.getBoundingClientRect();
        minimapViewport.x = rect.left;
        minimapViewport.y = viewportH - rect.bottom;
        minimapViewport.w = rect.width;
        minimapViewport.h = rect.height;
    }

    function applyRenderScale() {
        if (!renderer) {
            return;
        }

        renderer.setPixelRatio(renderDpr);
        renderer.setSize(viewportW, viewportH);
    }

    function setupTerrainSampler() {
        if (!terrainMesh || !terrainMesh.geometry || !terrainMesh.geometry.attributes.position) {
            return;
        }

        terrainPosArray = terrainMesh.geometry.attributes.position.array;
        terrainRes = config.res;
        terrainVertsPerRow = terrainRes + 1;
        terrainSize = config.chunkSize;
        terrainHalfSize = terrainSize / 2;
    }

    function sampleTerrainHeight(x, z) {
        if (!terrainPosArray) {
            return -100;
        }

        if (x < -terrainHalfSize || x > terrainHalfSize || z < -terrainHalfSize || z > terrainHalfSize) {
            return -100;
        }

        const u = ((x + terrainHalfSize) / terrainSize) * terrainRes;
        const v = ((z + terrainHalfSize) / terrainSize) * terrainRes;

        let ix;
        let iz;
        let fx;
        let fz;

        if (u <= 0) {
            ix = 0;
            fx = 0;
        } else if (u >= terrainRes) {
            ix = terrainRes - 1;
            fx = 1;
        } else {
            ix = Math.floor(u);
            fx = u - ix;
        }

        if (v <= 0) {
            iz = 0;
            fz = 0;
        } else if (v >= terrainRes) {
            iz = terrainRes - 1;
            fz = 1;
        } else {
            iz = Math.floor(v);
            fz = v - iz;
        }

        const row0 = iz * terrainVertsPerRow;
        const row1 = (iz + 1) * terrainVertsPerRow;
        const a = (row0 + ix) * 3 + 1;
        const d = (row0 + ix + 1) * 3 + 1;
        const b = (row1 + ix) * 3 + 1;
        const c = (row1 + ix + 1) * 3 + 1;

        const ha = terrainPosArray[a];
        const hb = terrainPosArray[b];
        const hc = terrainPosArray[c];
        const hd = terrainPosArray[d];

        if (fx + fz <= 1) {
            return ha * (1 - fx - fz) + hb * fz + hd * fx;
        }

        return hb * (1 - fx) + hc * (fx + fz - 1) + hd * (1 - fz);
    }

    function getBiome(y, moisture) {
        if (y < 2) {
            return "Beach";
        }
        if (y > 70) {
            return "Snow";
        }
        if (y > 45) {
            return "Mountain";
        }
        if (moisture < -0.25) {
            return "Desert";
        }
        if (moisture < 0.2) {
            return "Grassland";
        }
        return "Forest";
    }

    function setupUIControls() {
        ui.startBtn.addEventListener("click", () => controls.lock());

        controls.addEventListener("lock", () => {
            ui.pauseMenu.style.opacity = 0;
            window.setTimeout(() => {
                ui.pauseMenu.style.display = "none";
            }, 300);
            gameActive = true;
        });

        controls.addEventListener("unlock", () => {
            ui.pauseMenu.style.display = "flex";
            window.setTimeout(() => {
                ui.pauseMenu.style.opacity = 1;
            }, 10);
            gameActive = false;
        });
    }

    function setupLights() {
        const ambient = new THREE.AmbientLight(0xffffff, 0.8);
        scene.add(ambient);

        const hemisphere = new THREE.HemisphereLight(0xffffff, 0xaaeeff, 0.4);
        hemisphere.position.set(0, 200, 0);
        scene.add(hemisphere);

        const sunLight = new THREE.DirectionalLight(0xffffff, 1.1);
        sunLight.position.set(200, 300, 100);
        sunLight.castShadow = perf.shadowEnabled;

        if (perf.shadowEnabled) {
            const distance = 500;
            sunLight.shadow.mapSize.width = perf.shadowMapSize;
            sunLight.shadow.mapSize.height = perf.shadowMapSize;
            sunLight.shadow.camera.left = -distance;
            sunLight.shadow.camera.right = distance;
            sunLight.shadow.camera.top = distance;
            sunLight.shadow.camera.bottom = -distance;
            sunLight.shadow.bias = -0.00005;
        }

        scene.add(sunLight);
    }

    function generateWorld() {
        const geometry = new THREE.PlaneGeometry(config.chunkSize, config.chunkSize, config.res, config.res);
        geometry.rotateX(-Math.PI / 2);

        const pos = geometry.attributes.position;
        const posArr = pos.array;
        const count = pos.count;
        const colors = new Float32Array(count * 3);

        for (let i = 0; i < count; i++) {
            const i3 = i * 3;
            const x = posArr[i3];
            const z = posArr[i3 + 2];

            let y = noise.noise2D(x * 0.002, z * 0.002) * 80;
            y += noise.noise2D(x * 0.01, z * 0.01) * 20;
            y += noise.noise2D(x * 0.03, z * 0.03) * 5;

            const moisture = moistureNoise.noise2D(x * 0.003 + 1000, z * 0.003 + 1000);
            const distSq = x * x + z * z;

            if (distSq < 2500) {
                y *= Math.sqrt(distSq) / 50;
            }

            posArr[i3 + 1] = y;

            const biome = getBiome(y, moisture);
            let color = Palette.Snow;

            if (biome === "Beach" || biome === "Desert") {
                color = Palette.Sand;
            } else if (biome === "Grassland") {
                color = Palette.GrassLight;
            } else if (biome === "Forest") {
                color = Palette.GrassDark;
            } else if (biome === "Mountain") {
                color = Palette.RockRed;
            }

            colors[i3] = color.r;
            colors[i3 + 1] = color.g;
            colors[i3 + 2] = color.b;
        }

        geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
        geometry.computeVertexNormals();

        const material = new THREE.MeshStandardMaterial({
            vertexColors: true,
            flatShading: true,
            roughness: 0.9,
            metalness: 0.0
        });

        terrainMesh = new THREE.Mesh(geometry, material);
        terrainMesh.receiveShadow = perf.shadowEnabled;
        terrainMesh.castShadow = perf.shadowEnabled;
        scene.add(terrainMesh);
        setupTerrainSampler();

        const waterGeo = new THREE.PlaneGeometry(config.chunkSize, config.chunkSize, config.waterRes, config.waterRes);
        waterGeo.rotateX(-Math.PI / 2);

        const waterMat = new THREE.ShaderMaterial({
            uniforms: THREE.UniformsUtils.clone(WaterShader.uniforms),
            vertexShader: WaterShader.vertexShader,
            fragmentShader: WaterShader.fragmentShader,
            transparent: true,
            side: THREE.DoubleSide,
            depthWrite: false,
            blending: THREE.NormalBlending
        });

        waterMesh = new THREE.Mesh(waterGeo, waterMat);
        waterMesh.position.y = -2;
        scene.add(waterMesh);

        generateObjects();
    }

    function generateObjects() {
        obstacleGrid.clear();

        const matTrunk = new THREE.MeshStandardMaterial({ color: 0x8b4513, flatShading: true });
        const matPine = new THREE.MeshStandardMaterial({ color: Palette.TreeGreen, flatShading: true });
        const matPink = new THREE.MeshStandardMaterial({ color: Palette.TreePink, flatShading: true });
        const matCactus = new THREE.MeshStandardMaterial({ color: Palette.Cactus, flatShading: true });
        const matStone = new THREE.MeshStandardMaterial({ color: Palette.Stone, flatShading: true });
        const matSnowRock = new THREE.MeshStandardMaterial({ color: 0xe0ffff, flatShading: true });

        const geoPineTrunk = new THREE.CylinderGeometry(0.4, 0.6, 2.5, 6);
        const geoPineCone = new THREE.CylinderGeometry(0, 1, 2.5, 7);
        const geoRoundTrunk = new THREE.CylinderGeometry(0.3, 0.4, 2, 6);
        const geoRoundLeaf = new THREE.IcosahedronGeometry(1.8, 1);
        const geoCactusMain = new THREE.CylinderGeometry(0.4, 0.4, 1, 7);
        const geoCactusTop = new THREE.SphereGeometry(0.4, 7, 7);
        const geoCactusArm = new THREE.CylinderGeometry(0.25, 0.25, 1, 6);
        const geoRock = new THREE.DodecahedronGeometry(1, 0);

        const pineTrunks = [];
        const pineCones = [];
        const roundTrunks = [];
        const roundLeavesPine = [];
        const roundLeavesPink = [];
        const cactusMains = [];
        const cactusTops = [];
        const cactusArms = [];
        const rocksStone = [];
        const rocksSnow = [];

        function pushInstance(list, x, y, z, rx, ry, rz, sx, sy, sz) {
            list.push({ x, y, z, rx, ry, rz, sx, sy, sz });
        }

        for (let i = 0; i < config.objectAttempts; i++) {
            const x = (Math.random() - 0.5) * (config.chunkSize * 0.8);
            const z = (Math.random() - 0.5) * (config.chunkSize * 0.8);

            if (x * x + z * z < 400) {
                continue;
            }

            const y = sampleTerrainHeight(x, z);
            if (y <= -99) {
                continue;
            }

            const moisture = moistureNoise.noise2D(x * 0.003 + 1000, z * 0.003 + 1000);
            const biome = getBiome(y, moisture);

            if (biome === "Desert") {
                if (Math.random() > 0.6) {
                    const rotY = Math.random() * Math.PI * 2;
                    const mainH = 2 + Math.random();
                    pushInstance(cactusMains, x, y + mainH / 2, z, 0, rotY, 0, 1, mainH, 1);
                    pushInstance(cactusTops, x, y + mainH, z, 0, rotY, 0, 1, 1, 1);

                    if (Math.random() > 0.3) {
                        const ox = 0.5 * Math.cos(rotY);
                        const oz = -0.5 * Math.sin(rotY);
                        pushInstance(cactusArms, x + ox, y + mainH * 0.6, z + oz, 0, rotY, -Math.PI / 4, 1, 1, 1);
                    }

                    addObstacle(x, z, 0.8);
                } else {
                    const scale = (1 + Math.random()) * 0.5;
                    pushInstance(rocksStone, x, y + scale * 0.3, z, Math.random() * 3, Math.random() * 3, Math.random() * 3, scale, scale * 0.8, scale);
                    addObstacle(x, z, scale * 0.8);
                }
            } else if (biome === "Forest") {
                const rotY = Math.random() * Math.PI * 2;
                pushInstance(pineTrunks, x, y + 1.25, z, 0, rotY, 0, 1, 1, 1);

                for (let layer = 0; layer < 3; layer++) {
                    const scale = 2.5 - layer * 0.7;
                    pushInstance(pineCones, x, y + 2.5 + layer * 1.5, z, 0, rotY, 0, scale, 1, scale);
                }

                addObstacle(x, z, 0.8);
            } else if (biome === "Grassland") {
                const rotY = Math.random() * Math.PI * 2;
                const scale = 0.8 + Math.random() * 0.5;
                pushInstance(roundTrunks, x, y + scale, z, 0, rotY, 0, scale, scale, scale);
                pushInstance(Math.random() > 0.7 ? roundLeavesPink : roundLeavesPine, x, y + 3 * scale, z, 0, rotY, 0, scale, scale, scale);
                addObstacle(x, z, 0.8 * scale);
            } else if (biome === "Mountain" || biome === "Snow") {
                const scale = (1 + Math.random()) * 1.5;
                pushInstance(biome === "Snow" ? rocksSnow : rocksStone, x, y + scale * 0.3, z, Math.random() * 3, Math.random() * 3, Math.random() * 3, scale, scale * 0.8, scale);
                addObstacle(x, z, scale * 0.8);
            }
        }

        const dummy = new THREE.Object3D();

        function buildInstanced(geometry, material, list) {
            if (list.length === 0) {
                return;
            }

            const mesh = new THREE.InstancedMesh(geometry, material, list.length);
            mesh.instanceMatrix.setUsage(THREE.StaticDrawUsage);
            mesh.castShadow = perf.shadowEnabled;
            mesh.receiveShadow = perf.shadowEnabled;
            mesh.frustumCulled = false;

            for (let i = 0; i < list.length; i++) {
                const item = list[i];
                dummy.position.set(item.x, item.y, item.z);
                dummy.rotation.set(item.rx, item.ry, item.rz);
                dummy.scale.set(item.sx, item.sy, item.sz);
                dummy.updateMatrix();
                mesh.setMatrixAt(i, dummy.matrix);
            }

            mesh.instanceMatrix.needsUpdate = true;
            scene.add(mesh);
        }

        buildInstanced(geoPineTrunk, matTrunk, pineTrunks);
        buildInstanced(geoPineCone, matPine, pineCones);
        buildInstanced(geoRoundTrunk, matTrunk, roundTrunks);
        buildInstanced(geoRoundLeaf, matPine, roundLeavesPine);
        buildInstanced(geoRoundLeaf, matPink, roundLeavesPink);
        buildInstanced(geoCactusMain, matCactus, cactusMains);
        buildInstanced(geoCactusTop, matCactus, cactusTops);
        buildInstanced(geoCactusArm, matCactus, cactusArms);
        buildInstanced(geoRock, matStone, rocksStone);
        buildInstanced(geoRock, matSnowRock, rocksSnow);
    }

    function generateClouds() {
        cloudGroup = new THREE.Group();
        const cloudGeo = new THREE.BoxGeometry(1, 1, 1);
        const cloudMat = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            flatShading: true,
            opacity: 0.85,
            transparent: true
        });

        const range = config.chunkSize * 0.8;

        for (let i = 0; i < config.cloudCount; i++) {
            const cloud = new THREE.Group();
            const blocks = 3 + Math.floor(Math.random() * 4);

            for (let b = 0; b < blocks; b++) {
                const mesh = new THREE.Mesh(cloudGeo, cloudMat);
                mesh.castShadow = false;
                mesh.receiveShadow = false;
                mesh.position.set(
                    (Math.random() - 0.5) * 18,
                    (Math.random() - 0.5) * 5,
                    (Math.random() - 0.5) * 12
                );

                const scale = 8 + Math.random() * 12;
                mesh.scale.set(scale, scale * 0.6, scale);
                cloud.add(mesh);
            }

            cloud.position.set(
                (Math.random() - 0.5) * range,
                100 + Math.random() * 50,
                (Math.random() - 0.5) * range
            );

            cloudGroup.add(cloud);
        }

        scene.add(cloudGroup);
    }

    function onKeyDown(event) {
        switch (event.code) {
            case "KeyW":
                keyState.forward = true;
                break;
            case "KeyA":
                keyState.left = true;
                break;
            case "KeyS":
                keyState.backward = true;
                break;
            case "KeyD":
                keyState.right = true;
                break;
            case "Space":
                if (isGrounded) {
                    playerVelocity.y = config.jumpForce;
                    isGrounded = false;
                } else {
                    isGliding = true;
                }
                break;
            case "ShiftLeft":
                isRunning = true;
                break;
            default:
                break;
        }
    }

    function onKeyUp(event) {
        switch (event.code) {
            case "KeyW":
                keyState.forward = false;
                break;
            case "KeyA":
                keyState.left = false;
                break;
            case "KeyS":
                keyState.backward = false;
                break;
            case "KeyD":
                keyState.right = false;
                break;
            case "Space":
                isGliding = false;
                break;
            case "ShiftLeft":
                isRunning = false;
                break;
            default:
                break;
        }
    }

    function onWindowResize() {
        updateMinimapViewportCache();
        camera.aspect = viewportW / viewportH;
        camera.updateProjectionMatrix();
        baseDpr = Math.min(window.devicePixelRatio || 1, perf.maxDpr);
        renderDpr = Math.min(renderDpr, baseDpr);
        applyRenderScale();
    }

    function handleVisibilityChange() {
        pageVisible = !document.hidden;
        lastRenderNow = 0;
        lastScaleNow = 0;
        fpsSmoothed = 0;
        lastFpsHudNow = 0;
    }

    function updatePlayer(dt) {
        if (controls.isLocked) {
            if (isRunning && (keyState.forward || keyState.backward || keyState.left || keyState.right)) {
                stamina = Math.max(0, stamina - 25 * dt);
                if (stamina <= 0) {
                    isRunning = false;
                }
            } else {
                stamina = Math.min(100, stamina + 15 * dt);
            }

            staminaUiCooldown -= dt;
            const staminaRounded = Math.round(stamina);
            if (staminaRounded !== staminaUiLast && staminaUiCooldown <= 0) {
                staminaUiLast = staminaRounded;
                ui.staminaBar.style.width = `${staminaRounded}%`;
                staminaUiCooldown = 0.05;
            }

            playerDirection.z = Number(keyState.forward) - Number(keyState.backward);
            playerDirection.x = Number(keyState.right) - Number(keyState.left);
            playerDirection.normalize();

            let speed = isRunning ? config.runSpeed : config.speed;
            if (isGliding && !isGrounded) {
                speed = Math.max(speed, config.glideSpeed);
            }

            if (keyState.forward || keyState.backward) {
                playerVelocity.z -= playerDirection.z * speed * 10.0 * dt;
            }

            if (keyState.left || keyState.right) {
                playerVelocity.x -= playerDirection.x * speed * 10.0 * dt;
            }
        }

        playerVelocity.x -= playerVelocity.x * 10.0 * dt;
        playerVelocity.z -= playerVelocity.z * 10.0 * dt;

        let shouldShowGlideHint = false;
        if (isGliding && !isGrounded && playerVelocity.y < 0) {
            playerVelocity.y -= config.glideGravity * dt;
            playerVelocity.y = Math.max(playerVelocity.y, -5.0);
            shouldShowGlideHint = true;
        } else {
            playerVelocity.y -= config.gravity * dt;
        }

        if (shouldShowGlideHint !== glideHintVisible) {
            glideHintVisible = shouldShowGlideHint;
            ui.glideHint.style.opacity = shouldShowGlideHint ? 1 : 0;
        }

        controls.moveRight(-playerVelocity.x * dt);
        controls.moveForward(-playerVelocity.z * dt);

        const pPos = camera.position;
        const playerRadius = 0.6;
        const cellX = Math.floor(pPos.x / obstacleCellSize);
        const cellZ = Math.floor(pPos.z / obstacleCellSize);

        for (let dz = -1; dz <= 1; dz++) {
            for (let dx = -1; dx <= 1; dx++) {
                const cell = obstacleGrid.get(obstacleKey(cellX + dx, cellZ + dz));
                if (!cell) {
                    continue;
                }

                for (const obstacle of cell) {
                    if (Math.abs(pPos.x - obstacle.x) > 10 || Math.abs(pPos.z - obstacle.z) > 10) {
                        continue;
                    }

                    const dxPos = pPos.x - obstacle.x;
                    const dzPos = pPos.z - obstacle.z;
                    const distSq = dxPos * dxPos + dzPos * dzPos;
                    const minRadius = playerRadius + obstacle.r;

                    if (distSq < minRadius * minRadius) {
                        const dist = Math.sqrt(distSq);
                        if (dist < 0.001) {
                            pPos.x += 0.1;
                            continue;
                        }

                        const overlap = minRadius - dist;
                        pPos.x += (dxPos / dist) * overlap;
                        pPos.z += (dzPos / dist) * overlap;
                    }
                }
            }
        }

        const groundHeight = sampleTerrainHeight(pPos.x, pPos.z);

        if (pPos.y < groundHeight + config.eyeHeight) {
            playerVelocity.y = Math.max(0, playerVelocity.y);
            pPos.y = groundHeight + config.eyeHeight;
            isGrounded = true;
            isGliding = false;
        } else {
            isGrounded = false;
        }

        pPos.y += playerVelocity.y * dt;

        if (pPos.y < -50) {
            playerVelocity.set(0, 0, 0);
            pPos.set(0, 80, 0);
        }
    }

    function updateBiome() {
        const moisture = moistureNoise.noise2D(camera.position.x * 0.003 + 1000, camera.position.z * 0.003 + 1000);
        const y = camera.position.y - config.eyeHeight;
        ui.biomeDisplay.textContent = getBiome(y, moisture).toUpperCase();
    }

    function updateHud() {
        ui.posDisplay.textContent = `${Math.round(camera.position.x)}, ${Math.round(camera.position.z)}`;
        camera.getWorldDirection(tmpDir);
        const angle = Math.atan2(tmpDir.x, tmpDir.z);
        const deg = -angle * (180 / Math.PI);
        ui.minimapArrow.style.transform = `translate(-50%, -50%) rotate(${deg}deg)`;
    }

    function updateAdaptiveScale(deltaMs, now) {
        const fps = 1000 / deltaMs;
        fpsSmoothed = fpsSmoothed ? (fpsSmoothed * 0.85 + fps * 0.15) : fps;

        if (ui.fpsHud && now - lastFpsHudNow >= 250) {
            ui.fpsHud.textContent = `${Math.round(fpsSmoothed)} FPS · ${renderDpr.toFixed(2)}x`;
            lastFpsHudNow = now;
        }

        if (!gameActive || now - lastScaleNow < 1000) {
            return;
        }

        const downThreshold = perf.targetFps * 0.78;
        const upThreshold = perf.targetFps * 0.94;

        if (fpsSmoothed < downThreshold && renderDpr > perf.minDpr) {
            renderDpr = Math.max(perf.minDpr, Math.round((renderDpr - 0.1) * 100) / 100);
            applyRenderScale();
        } else if (fpsSmoothed > upThreshold && renderDpr < baseDpr) {
            renderDpr = Math.min(baseDpr, Math.round((renderDpr + 0.1) * 100) / 100);
            applyRenderScale();
        }

        lastScaleNow = now;
    }

    function renderScene() {
        renderer.setViewport(0, 0, viewportW, viewportH);
        renderer.setScissor(0, 0, viewportW, viewportH);
        renderer.setScissorTest(true);
        renderer.clear();
        renderer.render(scene, camera);

        if (minimapViewport.w > 0 && minimapViewport.h > 0) {
            renderer.setViewport(minimapViewport.x, minimapViewport.y, minimapViewport.w, minimapViewport.h);
            renderer.setScissor(minimapViewport.x, minimapViewport.y, minimapViewport.w, minimapViewport.h);
            renderer.clearDepth();

            mapCamera.position.x = camera.position.x;
            mapCamera.position.z = camera.position.z;
            mapCamera.position.y = 200;
            mapCamera.lookAt(camera.position.x, 0, camera.position.z);
            renderer.render(scene, mapCamera);
        }

        renderer.setScissorTest(false);
    }

    function animate(now) {
        animationFrameId = requestAnimationFrame(animate);

        if (!pageVisible) {
            return;
        }

        const targetFps = gameActive ? perf.targetFps : perf.idleFps;
        const frameInterval = 1000 / Math.max(targetFps, 1);

        if (!lastRenderNow) {
            lastRenderNow = now;
        }

        const deltaMs = now - lastRenderNow;
        if (deltaMs < frameInterval) {
            return;
        }

        lastRenderNow = now;
        const dt = Math.min(deltaMs / 1000, 0.05);
        elapsedTime += dt;
        updateAdaptiveScale(deltaMs, now);

        if (gameActive) {
            updatePlayer(dt);

            biomeCooldown -= dt;
            if (biomeCooldown <= 0) {
                biomeCooldown = 0.45;
                updateBiome();
            }

            if (waterMesh) {
                waterMesh.material.uniforms.time.value = elapsedTime;
            }

            if (cloudGroup) {
                cloudGroup.position.x += dt * 1.8;
            }

            hudCooldown -= dt;
            if (hudCooldown <= 0) {
                hudCooldown = 0.066;
                updateHud();
            }
        }

        renderScene();
    }

    function init() {
        scene = new THREE.Scene();
        scene.background = Palette.Sky;
        scene.fog = new THREE.Fog(Palette.Sky, 50, config.viewDistance);

        camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 2000);
        camera.position.set(0, 80, 0);

        const mapSize = config.minimapCamSize;
        mapCamera = new THREE.OrthographicCamera(mapSize / -2, mapSize / 2, mapSize / 2, mapSize / -2, 1, 1000);
        mapCamera.up.set(0, 0, -1);
        mapCamera.lookAt(0, -1, 0);

        renderer = new THREE.WebGLRenderer({
            antialias: perf.antialias,
            alpha: false,
            powerPreference: perf.powerPreference
        });
        renderer.shadowMap.enabled = perf.shadowEnabled;
        renderer.shadowMap.type = perf.lowEnd ? THREE.PCFShadowMap : THREE.PCFSoftShadowMap;
        renderer.shadowMap.autoUpdate = false;
        renderer.shadowMap.needsUpdate = perf.shadowEnabled;
        renderer.autoClear = false;
        renderer.outputEncoding = THREE.sRGBEncoding;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.1;
        renderer.domElement.classList.add("world-canvas");
        document.body.appendChild(renderer.domElement);

        updateMinimapViewportCache();
        applyRenderScale();

        controls = new THREE.PointerLockControls(camera, document.body);
        setupUIControls();

        setupLights();
        generateWorld();
        generateClouds();
        updateBiome();
        updateHud();
        ui.staminaBar.style.width = "100%";

        window.addEventListener("resize", onWindowResize);
        document.addEventListener("keydown", onKeyDown);
        document.addEventListener("keyup", onKeyUp);
        document.addEventListener("visibilitychange", handleVisibilityChange);

        animationFrameId = requestAnimationFrame(animate);
    }

    init();

    window.addEventListener("beforeunload", () => {
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
        }
    });
})();
