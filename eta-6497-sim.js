// 3D Javacript ETA 6497 Clock using three.js
// MIT License. - Work In Progress
// Jeff Miller 2025. 9/15/25

/* References and Notes
- AI Development Support & Debugging: Google Gemini
- HDRI Texture: https://polyhaven.com/a/colorful_studio
- PBR Textures: https://www.cgbookcase.com/
- Modified ETA 6497-1 Watch Movement CAD model by Steen Winther: https://grabcad.com/library/eta-6497-1-complete-watch-movement
- Modified ETA 6497 Skeleton Top CAD model by Veislav Murdrak:  https://grabcad.com/library/eta-6497-movement-1
- Created ETA 6497 Custom Clock Hands and Clock Case made in Fusion 360
- 5 Hz Tick Sound - Clock Ticking by RedDog0607: https://pixabay.com/sound-effects/clock-ticking-365218/
- Development and Debugging Tools: Google Gemini
- File encoding is set to UF-8
- Local Server: python -m http.server run in a terminal in local javascript directory with index.html
- 	http://localhost:8000 in a local browser tab
- Single click brings up gui
- Zoom, Pan (right mouse button or two finger touch), and rotate are supported
- Slow down time! Note that you either need to reset the clock in the GUI or reload the web page to get accurate time if the beat rate is changed!
*/

/*
To Do:
- Finish textures
- Finish gears animation
- Add option to "explode parts"
- Fix tilt mode for mobile devices - Partially working
- Clean up skeleton top alignment and third wheel support
*/

/*

NOTES (Will eventually move this to the ReadMe file):

- Fusion 360 to .OBJ to Blender to .GLB
	- Note: Use "remove" instead of "delete" when removing F360 bodies and keep the history timeline.
	- Select "Split By Group" when importing into Blender under import file dialog options to keep mesh body names
	- Select Up Axis as -Z and Forward Axis as Y based on the orientation used in F360, may change for other models
 	- For high poly model:
  		- Tesslate high quality in Fusion 360.
		- Select "Create Quads" or texture UVs will not work properly in Blender
  		- Import .OBJ file into Blender, but select "Split By Group" before importing or the indivudal mesh names will not be imported.
		- In Blender, UVs will need to be created for all mesh bodies
  		- Select the object mesh and right click. Pick "Shade Auto Smooth" so individual polygons will not be visible in JavaScript.
		- With the object selected, hit Tab or go into the Edit mode
  		- Select the mesh and hit L to ensure all of the faces are selected
		- Select "U" to bring up the UV menu and select "Smart UV Project"
  		- Select the UV editor screen from the icon with the round ball over a grid in the upper left
		- The texture map UV should be visible. Scale it up by about 10x to get fine (less rough detail) for importing textures into JavaScript 
		- Export .GLB, +Y transform out of Blender and save in three.js folder

- ETA 6497 Watch Movement Notes:
- https://calibercorner.com/unitas-caliber-6497/
- Movement is 36.6mm in diameter and 4.5mm thick
- 18,000 vibrations per hour (VPH) (balance wheel swing)
	- 3600 seconds/hour
	- One tick sound for ballance wheel full swing
	- Tick per second = 18,000 VPH / 3600 sec/hr = 5 ticks per second
- Drive Train
	- Center Wheel: Carries Minute hand and rotates once per hour
		- Driven by the Main Spring Barrel. Cannon Pinon Arbor has gear teeth that is press fit into the center wheel's arbor. 
		  The arbor friction acts as a clutch. When the crown is moved to set the time, the minute wheel is turned. The
		  force applied is enough to overcome friction allowing the pinion to slip and rotate independently on the Center
		  wheel arbor. This allows the hands to move without breaking or backwinding the entire drive train!
	
	- To Do: Add Cannon Pinion Back! (Start over with original model now using .glb!)
	- DriverCannonPinion_Gear_Body for rotation.
	- Small Center Wheel gear rotates with Center Gear. Separated for material color.
	- SecondWheelSmallGear rotates with the second wheel. Silver instead of brass.
	- ThirdWheelBottomGear & ThirdWheelTopGear silver moves with ThirdWheel
	- Third Wheel: Rotates every 7.5 minutes counterclockwise from dial side
	- Fourth Wheel: Carries small seconds hand and rotates once per minute. Also drives the escapement
	- Escape Wheel: Advances by half a tooth per beat (15 teeth), resulting in a full rotation every 5 seconds counter clockwise.
	- Crown Wheel: Used to wind the main spring. Turns with the crown.
	- Hour Wheel rotates 1 revolution every 12 hours (720 min).
	- Minute Wheel: Used to set the time with the crown and also drives the hour hand.
		- Drive rate: cannon pinion rotates 1 rotaton per hour. Gear ratio driven minute wheel 36 teeth / driving gear pinon =3
		- Rotation rate is 1 rev per hour / 3 = 1/3 revolution per hour  **** Need to check or fix
	- Balance Wheel: 270 to 310 degrees, 2.5 Hz or 1 per 0.4 seconds back and forth.
	- Power Flow: Mainspring Barrel (First Wheel) -> Center Wheel -> Third Wheel
	- Time Delay (Locking Phase)
		- Escape wheel is stationary when the pallet fork is at its maximum displacement, which is at:
			- At +1.5 to +2 degrees, one of the pallet jewels (for instance, the entry pallet) is holding 
			an escape wheel tooth, and the fork is resting against one banking pin.
			- At -1.5 to -2 degrees, the other pallet jewel (the exit pallet) is holding the next escape wheel tooth, 
			- and the fork is resting against the opposite banking pin.
		- 1. Start of Cycle (0.0 Seconds): Balance wheel is at its fastest, passing through the center.
			It kicks the pallet fork, unlocking the escape wheel. The escape wheel moves one tooth (impulse), which
			happens almost instantly. The first 0.2 second pause begins. 
		- 2. Mid Cycle (0.2 Seconds): Balance wheel reaches end of its swing and starts back the other way. It passes
			through the center again, kicks the pallet fork, and unlocks the escape wheel again. The escape wheel moves	
			another tooth. This ends the first pause and immediately begins the second 0.2 second pause.
		- 3. End of cycle (0.4 Seconds): Balance wheel reaces the end of its second swing and starts back.
*/


// Load Dependencies
import * as THREE from 'three';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';

// --- Declare UI element variables in the global scope ---
let digitalDate, digitalClock, fpsCounter; //
let gui; //
let pointerDownTime; //
let pointerDownPos = new THREE.Vector2(); //
let environmentTexture = null; // <-- To hold the loaded HDRI texture

// --- Variables for smooth camera reset animation ---
const clock = new THREE.Clock();  //
let isResettingCamera = false; //
const cameraResetTargetPos = new THREE.Vector3(0, 0, 60); //
const cameraResetTargetTarget = new THREE.Vector3(0, 0, 0); //
let isUserInteracting = false; //

// --- Cache variables for light replacement ---
let _lightPosition = new THREE.Vector3();
let _lightTargetPosition = new THREE.Vector3();
let _shadowCameraSettings = {};

// --- Camera Zoom Variables ---
let maxZoomInDistance = 30; // Default min distance
let maxZoomOutDistance = 90; // Default max distance

const modelFiles = {
    'High Quality': 'ETA6497-1.glb',
    'Low Quality': 'ETA6497-1_LowPoly.glb'
};

const settings = {
    clockRunning: true, //
    showDateTime: false,  //
    tiltEnabled: false, //
    soundEnabled: false, //
    soundVolume: 0.2,   // Default volume
    showFPS: false,  //
    showShadowBox: true, 
    skeletonTopTransparency: 0.75, //
    bridgeTransparency: 0.75, //
    listMeshBodies: false,  //
    showHDRI: false, //
    beatRate: 5.0,  // This is the GUI-bound setting
    shadowResolution: 2048, // Default is 2048
    maxPixelRatio: 1.5,
    wireframe: false, // <-- Added wireframe setting
    modelLOD: 'High Quality', // This will be overridden by device detection below
    cameraZoom: 1.2, // Default setting to zoom for the watch to fill the display
    // --- Default values set to 0 ---
    startPhaseOffsetDeg: 0.0, // Defaulting to 0 degrees
    escapeWheelOffsetDeg: 0.0, // Defaulting to 0 degrees
    resetCamera: () => {
        if (isResettingCamera) return; // Prevent re-triggering during animation
    
        // 1. Reset the cameraZoom setting to the default value.
        settings.cameraZoom = 1.2;
    
        // 2. Update the GUI slider/textbox to show the new value.
        if (gui) {
            const zoomController = gui.controllers.find(c => c.property === 'cameraZoom');
            if (zoomController) {
                zoomController.updateDisplay();
            }
        }
    
        // 3. Calculate the target Z position based on the reset zoom value.
        const targetZ = calculateCameraZForZoom(settings.cameraZoom);
    
        // 4. Update the animation target with the calculated position.
        cameraResetTargetPos.set(0, 0, targetZ);
    
        // 5. Start the animation.
        isResettingCamera = true;
    },
    // --- This is now a wrapper to reset the beat rate AND the sim ---
    resetClock: () => { 
        // This is for the GUI BUTTON. It restores the default beat rate.
        settings.beatRate = 5.0; // Resets the GUI slider
        simulationBeatRate = 5.0; // Resets the "live" physics variable

        // Manually update the audio playback rate to match the 5.0 Hz reset
        if (currentTickSource) {
            currentTickSource.playbackRate.value = 1.0; // 1.0 = 5.0Hz / 5.0Hz base
        }
            
        _resetSimulation(); // Run the core simulation reset
    },
};

// --- Set Default LOD based on device type ---
const isMobileDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || /Mobi|Android|iPhone|iPad/.test(navigator.userAgent);
settings.modelLOD = isMobileDevice ? 'Low Quality' : 'High Quality';

// --- Core simulation reset logic ---
// This version is simplified to be deterministic. It resets our NEW
// physics clock to 0, which guarantees a perfect sync.
function _resetSimulation() {
    
    // --- FULL ESCAPEMENT STATE RESET ---
            
    // 1. Reset all physics and sim state variables to a known "zero state"
    simulationPhysicsTime = 0.0; // <-- CRITICAL: Reset our new physics clock
    STARTING_PHASE_OFFSET = 0.0;
    palletForkState = -1; 
    previousSineValue = -palletForkState; // = 1. This syncs with sin(0) which will immediately go positive.
    simulationTotalTicks = 0; 
    ESCAPE_WHEEL_OFFSET = 0.0;
    
    // Forcibly cancel any in-progress pallet animation to prevent a "ghost tick"
    // from firing after the reset, which would desync the gears.
    isPalletForkAnimating = false; 

    // 2. Update GUI sliders to reflect the reset "zero" state
    settings.startPhaseOffsetDeg = 0.0;
    settings.escapeWheelOffsetDeg = 0.0;

    if (palletFork) {
         // 3. Manually set pallet mesh to match the "zero" state
         palletFork.rotation.z = (PALLET_FORK_ANGLE * palletForkState) + PALLET_FORK_OFFSET;
    }
    // --- END ESCAPEMENT RESET ---

    // 4. Calculate new hand offsets and set simulation start time
    const now = new Date();
    const realHours24 = now.getHours();
    const realMinutes = now.getMinutes();
    const realSeconds = now.getSeconds();
    const realMillis = now.getMilliseconds();

    // Store the starting time in seconds from midnight for the digital display.
    simulationStartTimeInSeconds = (realHours24 * 3600) + (realMinutes * 60) + realSeconds;

    const realHours12 = now.getHours() % 12; // 0-11 for hand rotation

    // Get fractional time for smooth initial positioning
    const totalRealSecondsWithFraction = realSeconds + (realMillis / 1000.0);
    const totalRealMinutesWithFraction = realMinutes + (totalRealSecondsWithFraction / 60.0);
    const totalRealHoursWithFraction = realHours12 + (totalRealMinutesWithFraction / 60.0);

    // Calculate and store the initial rotation offsets (CCW is negative)
    initialSecondRotationOffset = -((totalRealSecondsWithFraction / 60.0) * Math.PI * 2);
    initialMinuteRotationOffset = -((totalRealMinutesWithFraction / 60.0) * Math.PI * 2);
    initialHourRotationOffset = -((totalRealHoursWithFraction / 12.0) * Math.PI * 2);
    // --- END HAND OFFSET CALCULATION ---
    
    balanceWheelAngles = { start: null, min: Infinity, max: -Infinity }; // Reset balance wheel metrics
    
    // 5. Update all GUI sliders to show the new "zeroed" values
    if (gui) { // Check if gui is initialized
        gui.controllers.forEach(c => { 
            c.updateDisplay(); // This will now correctly update beatRate, startPhase, AND escapeOffset sliders
        });
    }
    
    // 6. Run updateClockGears to put all gear meshes in their "zero" position (synced to ticks=0)
    updateClockGears();
}


// --- 3D Model Variables ---
let clockModel; //
let modelScale = 3.5; //
let secondWheel, minuteWheel, hourWheel, balanceWheel, escapeWheel, centerWheel, thirdWheel, palletFork, hairSpring, secondWheelSmallGear, thirdWheelTopGear; //
let newHourHand, newMinuteHand, newSecondHand; //
let collectedParts = {};  //
let shadowBoxWalls; // This will hold the wall meshes for easy toggling

// --- Add global offsets for hands ---
let initialSecondRotationOffset = 0;
let initialMinuteRotationOffset = 0;
let initialHourRotationOffset = 0;

// --- Simulation State Variables ---
let simulatedSeconds = 0; //
let simulationStartTimeInSeconds = 0;
// --- Add discrete counter. This is now the SINGLE SOURCE OF TRUTH for time.
let simulationTotalTicks = 0;
// --- Add stable "live" beat rate variable for physics ---
let simulationBeatRate = 5.0; // This is the "live" rate the physics engine uses.
// --- Add a dedicated, resettable clock for the physics simulation ---
let simulationPhysicsTime = 0.0;
// Set the starting direction of the pallet fork: 1 for CCW, -1 for CW.
let palletForkState = -1; //
// Synchronize the balance wheel's starting phase with the pallet fork's state.
// This should be the opposite of palletForkState.
let previousSineValue = -palletForkState; //
let balanceWheelAngles = { start: null, min: Infinity, max: -Infinity }; //
// --- Changed from 9 degrees to 5 degrees per user request ---
const PALLET_FORK_ANGLE = THREE.MathUtils.degToRad(5); //
const PALLET_FORK_OFFSET = THREE.MathUtils.degToRad(0); //
// A 15-tooth escape wheel requires 30 beats/steps for a full revolution. (360 / 30 = 12 degrees)
const ESCAPE_WHEEL_STEP = (Math.PI * 2) / 30;  // This is 12 degrees in radians

// --- Default offset value set to 0.0 ---
let ESCAPE_WHEEL_OFFSET = 0.0; //
// --- Default phase value set to 0.0 ---
let STARTING_PHASE_OFFSET = 0.0;

// --- Pallet Fork Animation State ---
// These are no longer used by the instantaneous escapement logic but are kept for potential future use.
let isPalletForkAnimating = false;
let palletForkAnimStartTime = 0;
const palletForkAnimDuration = 0.08;
let palletForkStartAngle = 0;
let palletForkTargetAngle = 0;


// --- Hairspring Animation Variables ---
let hairSpringMesh; //
// hairSpringOriginalPositions is no longer needed; shader uses original geometry attribute
let colletOriginalPos = new THREE.Vector3(); //
let hairspringBounds = { minZ: 0, maxZ: 0 }; //
let maxRadius = 0; //
const hairspringAnimationSettings = { //
    maxAmplitude: 0.22, //
    topWeightMultiplier: 0.59, //
    bottomWeightMultiplier: -0.06 //
};

// --- Web Audio API for gapless looping ---
// --- 1. Create AudioContext and global audio variables ---
let audioContext;
let tickAudioBuffer = null;     // This will hold the decoded sound data
let currentTickSource = null; // This holds the "player" node
let masterGainNode = null;      // This is our persistent volume control

try {
    // Create the global AudioContext and the master GainNode (volume)
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    masterGainNode = audioContext.createGain();
    masterGainNode.gain.value = 0.0; // Start muted
    masterGainNode.connect(audioContext.destination); // Connect gain to speakers ONCE
} catch (e) {
    console.error("Web Audio API is not supported in this browser.");
}

// --- 2. Asynchronously load and decode the audio file ---
if (audioContext) {
    fetch('textures/clock-ticking-5Hz.mp3')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status} while fetching audio file.`);
            }
            return response.arrayBuffer();
        })
        .then(arrayBuffer => audioContext.decodeAudioData(arrayBuffer))
        .then(decodedData => {
            tickAudioBuffer = decodedData; // Store the high-quality buffer
            console.log("Audio file loaded and decoded successfully (Web Audio API).");
        })
        .catch(e => {
            console.error("--- Audio Load Error (Web Audio) ---");
            console.error("Failed to fetch or decode audio file.", e);
        });
}


// --- Wait for the DOM to be ready, then create and inject UI elements ---
window.addEventListener('DOMContentLoaded', () => { //
    digitalDate = document.createElement('div'); //
    digitalClock = document.createElement('div'); //
    fpsCounter = document.createElement('div'); //


    Object.assign(digitalDate.style, { //
        position: 'absolute', bottom: '20px', left: '20px', //
        color: 'white', fontFamily: '"Courier New", Courier, monospace', //
        fontSize: '1.75em', textShadow: '0 0 8px black', zIndex: '10', //
        display: 'none'  //
    });
    Object.assign(digitalClock.style, { //
        position: 'absolute', bottom: '20px', right: '20px', //
        color: 'white', fontFamily: '"Courier New", Courier, monospace', //
        fontSize: '1.75em', textShadow: '0 0 8px black', zIndex: '10', //
        display: 'none' //
    });
    Object.assign(fpsCounter.style, { //
        position: 'absolute', top: '20px', left: '20px', //
        color: 'white', fontFamily: '"Courier New", Courier, monospace', //
        fontSize: '1.75em', textShadow: '0 0 8px black', zIndex: '10', //
        display: 'none' //
    });

    fpsCounter.style.display = settings.showFPS ? 'block' : 'none';

    document.body.appendChild(digitalDate); //
    document.body.appendChild(digitalClock); //
    document.body.appendChild(fpsCounter); //
    
    // --- GUI Setup ---
    gui = new GUI(); //
    gui.domElement.style.display = 'none'; //

    gui.add(settings, 'clockRunning').name('Run Clock'); //
    gui.add(settings, 'showDateTime').name('Show Date & Time').onChange(value => { //
        digitalDate.style.display = value ? 'block' : 'none'; //
        digitalClock.style.display = value ? 'block' : 'none'; //
    });

    // Conditionally add the Tilt option only on mobile devices.
    if (isMobileDevice) {
        gui.add(settings, 'tiltEnabled').name('Enable Tilt').onChange(value => { //
            if (value) { enableTilt(); } else { disableTilt(); } //
        });
    }

    // --- Sound controls linking to Web Audio API ---
    const soundEnabledController = gui.add(settings, 'soundEnabled').name('Enable Sound');

    // 1. Create the volume slider, link its onChange to the masterGainNode
     const volumeSliderController = gui.add(settings, 'soundVolume', 0.0, 1.0, 0.01).name('Volume').onChange(volumeValue => {
        if (masterGainNode) {
            masterGainNode.gain.value = volumeValue; // Update gain in real-time
        }
    });

    // 2. Hide the volume slider by default
    volumeSliderController.domElement.style.display = settings.soundEnabled ? 'block' : 'none';

    // 3. 'Enable Sound' onChange controls visibility, gain, and starts the master audio loop (once)
    soundEnabledController.onChange(value => { 
        if (value) {
            // User wants sound ON
            volumeSliderController.domElement.style.display = 'block'; // SHOW the slider
            if (masterGainNode) {
                masterGainNode.gain.value = settings.soundVolume; // Set gain to slider value
            }

            // Resume AudioContext if it's suspended (required by browsers)
            if (audioContext && audioContext.state === 'suspended') {
                audioContext.resume(); // This IS the user gesture
            }
            
            // If the audio is loaded BUT not playing yet, create and start the master loop.
            if (tickAudioBuffer && !currentTickSource) {
                currentTickSource = audioContext.createBufferSource();
                currentTickSource.buffer = tickAudioBuffer;
                currentTickSource.loop = true; // This is the GAPLESS loop
                
                // Set initial playback rate to match current slider
                currentTickSource.playbackRate.value = settings.beatRate / 5.0; 

                currentTickSource.connect(masterGainNode); // Connect: Source -> Gain
                currentTickSource.start(0); // Play the loop. It will now run forever.
            }
        } else {
            // User wants sound OFF
            volumeSliderController.domElement.style.display = 'none'; // HIDE the slider
            if (masterGainNode) {
                masterGainNode.gain.value = 0.0; // Just MUTE the loop. It continues silently.
            }
        }
    });

    gui.add(settings, 'showFPS').name('Show FPS').onChange(value => { //
        fpsCounter.style.display = value ? 'block' : 'none'; //
    });
    gui.add(settings, 'showShadowBox').name('Show Shadow Box').onChange(value => {
        if (shadowBoxWalls) {
            shadowBoxWalls.visible = value;
        }
    });
    
    gui.add(settings, 'skeletonTopTransparency', 0.0, 1.0, 0.01).name('Top Opacity').onChange(value => {
        const skeletonTop = collectedParts['6497_SkeltonFront'];
        if (skeletonTop && skeletonTop.material) {
            skeletonTop.material.transparent = true;
            skeletonTop.material.opacity = value;
            skeletonTop.visible = value > 0;
        }
    });

    gui.add(settings, 'bridgeTransparency', 0.0, 1.0, 0.01).name('Bottom Opacity').onChange(value => {
        // --- UPDATED: Use exact names for the meshes to modify ---
        const bridgeParts = ['BarrelBridgeBody', 'TrainWheelBridge', 'BalancingBridge'];
        bridgeParts.forEach(partName => {
            const part = collectedParts[partName];
            if (part && part.material) {
                part.material.transparent = true;
                part.material.opacity = value;
                part.visible = value > 0;
            }
        });
    });

    gui.add(settings, 'beatRate', 0.5, 5.0, 0.5).name('Beat Rate / Sec') 
        .onChange(newBeatRate => {
            if (currentTickSource) {
                const roundedRate = Math.round(newBeatRate * 2) / 2;
                currentTickSource.playbackRate.value = roundedRate / 5.0;
            }
        })
        .onFinishChange((finalBeatRate) => {
            const roundedRate = Math.round(finalBeatRate * 2) / 2;
            settings.beatRate = roundedRate;
            simulationBeatRate = roundedRate;
            _resetSimulation();
        });
    
    gui.add(settings, 'cameraZoom', 0.0, 2.0, 0.01).name('Camera Zoom').onChange(updateCameraZoom);

    gui.add(settings, 'resetClock').name('Reset Clock'); //
    gui.add(settings, 'resetCamera').name('Reset Camera'); //

    // --- Performance Settings Sub-Menu ---
    const performanceFolder = gui.addFolder('Performance Settings');
    
    performanceFolder.add(settings, 'shadowResolution', { 
        'Low (1024x1024)': 1024, 
        'High (2048x2048)': 2048,
        'Ultra (4096x4096)': 4096
    }).name('Shadow Resolution').onChange(value => {
        
        const resolution = parseInt(value);

        if (dirLight && resolution === dirLight.shadow.mapSize.width) {
            return;
        }

        if (dirLight) {
            if (dirLight.shadow.map) {
                dirLight.shadow.map.dispose();
            }
            scene.remove(dirLight.target);
            scene.remove(dirLight);
        }
        const newLight = new THREE.DirectionalLight(0xffffff, 2.5);
        newLight.position.copy(_lightPosition);
        newLight.castShadow = true;
        newLight.shadow.mapSize.width = resolution;
        newLight.shadow.mapSize.height = resolution;
        newLight.shadow.bias = -0.001;
        newLight.shadow.normalBias = 0.01;
        newLight.shadow.camera.left = _shadowCameraSettings.left;
        newLight.shadow.camera.right = _shadowCameraSettings.right;
        newLight.shadow.camera.top = _shadowCameraSettings.top;
        newLight.shadow.camera.bottom = _shadowCameraSettings.bottom;
        newLight.shadow.camera.near = _shadowCameraSettings.near;
        newLight.shadow.camera.far = _shadowCameraSettings.far;
        newLight.shadow.camera.updateProjectionMatrix();
        scene.add(newLight);
        newLight.target.position.copy(_lightTargetPosition);
        scene.add(newLight.target);
        dirLight = newLight;
        boxGroup.traverse((node) => {
            if (node.isMesh && node.material) {
                if (Array.isArray(node.material)) {
                    node.material.forEach(mat => mat.needsUpdate = true);
                } else {
                    node.material.needsUpdate = true;
                }
            }
        });
    });

    performanceFolder.add(settings, 'modelLOD', ['High Quality', 'Low Quality'])
        .name('Level of Detail')
        .onChange(value => {
            loadClockModel(value);
        });

    performanceFolder.add(settings, 'maxPixelRatio', 0.5, 2.0, 0.1).name('Pixel Ratio Cap').onChange(value => {
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, value));
    });

    performanceFolder.add(settings, 'wireframe').name('Show Wireframe').onChange(value => {
        boxGroup.traverse((node) => {
            if (node.isMesh && node.material) {
                if (Array.isArray(node.material)) {
                    node.material.forEach(mat => mat.wireframe = value);
                } else {
                    node.material.wireframe = value;
                }
            }
        });
    });
    
    // --- UPDATED: Troubleshooting Sub-Menu ---
    const troubleshootingFolder = gui.addFolder('Troubleshooting');
    troubleshootingFolder.close();

    troubleshootingFolder.add(settings, 'listMeshBodies').name('List All Mesh Bodies in Console').onChange(value => {
        if (value) {
            if (clockModel && Object.keys(collectedParts).length > 0) {
                console.log("--- All Mesh Bodies in GLTF Model ---");
                const meshNames = Object.keys(collectedParts).sort();
                meshNames.forEach(name => console.log(name));
                console.log(`--- Total: ${meshNames.length} meshes ---`);
            } else {
                console.warn("Model not yet loaded. Cannot list mesh bodies.");
            }
            setTimeout(() => {
                settings.listMeshBodies = false;
                const controller = troubleshootingFolder.controllers.find(c => c.property === 'listMeshBodies');
                if (controller) controller.updateDisplay();
            }, 200);
        }
    });

    troubleshootingFolder.add(settings, 'showHDRI').name('Show HDRI Background').onChange(value => {
        scene.background = value ? environmentTexture : null;
    });

    troubleshootingFolder.add(settings, 'startPhaseOffsetDeg', 0.0, 360.0, 0.1).name('Start Phase (Deg)').onChange(degrees => {
        STARTING_PHASE_OFFSET = THREE.MathUtils.degToRad(degrees);
        
        const newStartSineVal = Math.sin(STARTING_PHASE_OFFSET); 
        previousSineValue = newStartSineVal;
        palletForkState = (newStartSineVal >= 0) ? -1 : 1;
        
        if (palletFork) {
             palletFork.rotation.z = (PALLET_FORK_ANGLE * palletForkState) + PALLET_FORK_OFFSET;
        }
        
        updateClockGears();
    });

    troubleshootingFolder.add(settings, 'escapeWheelOffsetDeg', 0.0, 180.0, 0.1).name('Escape Wheel Offset').onChange(degrees => {
        ESCAPE_WHEEL_OFFSET = THREE.MathUtils.degToRad(degrees);
        updateClockGears();
    });
    
    // --- Refined Listeners for GUI toggle and Tilt Mode drag-to-disable ---
    let dragStarted = false;

    window.addEventListener('mousedown', onPointerDown);
    window.addEventListener('mousemove', onPointerMove);
    window.addEventListener('mouseup', onPointerUp);
    window.addEventListener('touchstart', onPointerDown, { passive: true });
    window.addEventListener('touchmove', onPointerMove);
    window.addEventListener('touchend', onPointerUp);

    function onPointerDown(event) {
        const pointer = event.touches ? event.touches[0] : event;
        pointerDownTime = Date.now();
        pointerDownPos.set(pointer.clientX, pointer.clientY);
        dragStarted = false; // Reset on new press
    }

    function onPointerMove(event) {
        if (!pointerDownTime || dragStarted) return; // Not pressed or drag already detected

        const pointer = event.touches ? event.touches[0] : event;
        const currentPos = new THREE.Vector2(pointer.clientX, pointer.clientY);
        
        // If moved more than a threshold, it's a drag to move the camera
        if (pointerDownPos.distanceTo(currentPos) > 15) {
            dragStarted = true; // Register the drag
            if (settings.tiltEnabled) {
                settings.tiltEnabled = false;
                disableTilt();
                
                const tiltController = gui.controllers.find(c => c.property === 'tiltEnabled');
                if (tiltController) {
                    tiltController.updateDisplay();
                }
            }
        }
    }

    function onPointerUp(event) {
        if (!pointerDownTime) return;

        // Only process as a tap for the GUI if a drag didn't occur
        if (!dragStarted) {
            const isTouchEvent = !!event.changedTouches;
            const pointer = isTouchEvent ? event.changedTouches[0] : event;
            const duration = Date.now() - pointerDownTime;
            const distance = pointerDownPos.distanceTo(new THREE.Vector2(pointer.clientX, pointer.clientY));
            
            if (duration < 200 && distance < 15) {
                if (gui.domElement.contains(pointer.target)) return;
                if (isTouchEvent) {
                    event.preventDefault();
                }
                gui.domElement.style.display = (gui.domElement.style.display === 'none') ? 'block' : 'none';
            }
        }
        
        // Reset state
        pointerDownTime = null;
    }

    // --- Add visibility change handler to reset clock on tab focus ---
    document.addEventListener('visibilitychange', () => {
        // When the tab becomes visible again, reset the clock to the current time.
        if (!document.hidden) {
            console.log("Tab is visible again. Resetting clock to current time.");
            _resetSimulation();
        }
    });

    // Initialize clock
    settings.resetClock();
    updateClockGears();
});

// --- Scene Setup ---
const scene = new THREE.Scene(); //
const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 1, 1000); //
const renderer = new THREE.WebGLRenderer({ antialias: true }); //

// Set pixel ratio based on the settings object for performance tuning.
renderer.setPixelRatio(Math.min(window.devicePixelRatio, settings.maxPixelRatio)); // Original was window.devicePixelRatio
renderer.setSize(window.innerWidth, window.innerHeight); //
renderer.outputColorSpace = THREE.SRGBColorSpace; //
renderer.toneMapping = THREE.ACESFilmicToneMapping; //
renderer.toneMappingExposure = 0.7; //
renderer.shadowMap.enabled = true; //
renderer.shadowMap.type = THREE.VSMShadowMap; //
document.body.appendChild(renderer.domElement); //

const controls = new OrbitControls(camera, renderer.domElement); //
controls.enableDamping = true; //

controls.addEventListener('start', () => { //
    isUserInteracting = true; //
    isResettingCamera = false; //
    // Tilt-disabling logic has been moved to the onPointerMove handler for better precision
});
controls.addEventListener('end', () => { //
    isUserInteracting = false; //
});

const loadingManager = new THREE.LoadingManager(); //
loadingManager.onLoad = () => { //
    console.log("All assets loaded successfully."); //
    layoutScene(); //
};

const rgbeLoader = new RGBELoader(loadingManager).setPath('textures/'); //
rgbeLoader.load('PolyHaven_colorful_studio_2k.hdr', (texture) => { //
    texture.mapping = THREE.EquirectangularReflectionMapping; //
    scene.environment = texture; //
    environmentTexture = texture; // <-- Store texture for GUI toggle
});

let dirLight = new THREE.DirectionalLight(0xffffff, 2.5); // Changed to let
dirLight.position.set(10, 28, 25); //
dirLight.castShadow = true; //
// Set initial shadow resolution from the settings object
dirLight.shadow.mapSize.width = settings.shadowResolution; 
dirLight.shadow.mapSize.height = settings.shadowResolution; 
const d = 15; //
dirLight.shadow.camera.left = -d; //
dirLight.shadow.camera.right = d; //
dirLight.shadow.camera.top = d; //
dirLight.shadow.camera.bottom = -d; //
dirLight.shadow.bias = -0.001; //
dirLight.shadow.normalBias = 0.01; //
scene.add(dirLight); //
scene.add(dirLight.target); //

// --- Create a master "clockUnit" group ---
const clockUnit = new THREE.Group(); //

// --- PBR Material Definitions ---
const textureLoader = new THREE.TextureLoader(loadingManager).setPath('textures/'); //
const parquetBaseColor = textureLoader.load('ParquetFlooring03_2K_BaseColor.png');
const parquetNormal = textureLoader.load('ParquetFlooring03_2K_Normal.png');
const parquetRoughness = textureLoader.load('ParquetFlooring03_2K_Roughness.png');
const parquetHeight = textureLoader.load('ParquetFlooring03_2K_Height.png');
const parquetAO = textureLoader.load('ParquetFlooring03_2K_AO.png'); // Ambient Occlusion
parquetBaseColor.colorSpace = THREE.SRGBColorSpace;
const wallMaterial = new THREE.MeshStandardMaterial({
    map: parquetBaseColor,
    normalMap: parquetNormal,
    roughnessMap: parquetRoughness,
    aoMap: parquetAO,
    aoMapIntensity: 1.0,
    displacementMap: parquetHeight,
    displacementScale: 0.05
});

const steelBaseColor = textureLoader.load('BrushedIron02_2K_BaseColor.png'); //
const steelNormal = textureLoader.load('BrushedIron02_2K_Normal.png'); //
const steelRoughness = textureLoader.load('BrushedIron02_2K_Roughness.png'); //
steelBaseColor.colorSpace = THREE.SRGBColorSpace; //
const steelTextures = [steelBaseColor, steelNormal, steelRoughness]; //
steelTextures.forEach(texture => { //
    texture.wrapS = THREE.RepeatWrapping; //
    texture.wrapT = THREE.RepeatWrapping; //
});
const brushedSteelMaterial = new THREE.MeshStandardMaterial({ //
    map: steelBaseColor, normalMap: steelNormal, roughnessMap: steelRoughness, //
    metalness: 0.9, roughness: 0.4, color: 0xe0e0e0 //
});

const lightBrushedSteelMaterial = new THREE.MeshStandardMaterial({
    map: steelBaseColor,        // Use the same texture
    normalMap: steelNormal,     // Use the same normal map
    roughnessMap: steelRoughness, // Use the same roughness map
    metalness: 1.0,             // This is the intended value
    roughness: 0.15,            // This is the intended value
    color: 0xe0e0e0,            // Keep the same base color
    normalScale: new THREE.Vector2(0.15, 0.15) // This is the intended value
});

const mediumBrushedSteelMaterial = new THREE.MeshStandardMaterial({
    map: steelBaseColor,        // Use the same texture
    normalMap: steelNormal,     // Use the same normal map
    roughnessMap: steelRoughness, // Use the same roughness map
    metalness: 0.95,            // This is the intended value
    roughness: 0.3375,          // This is the intended value
    color: 0xe0e0e0,            // Keep the same base color
    normalScale: new THREE.Vector2(0.2, 0.2) // This is the intended value
});

function cloneMaterialWithTextures(material) { //
    const newMaterial = material.clone(); //
    newMaterial.map = material.map.clone();
    newMaterial.normalMap = material.normalMap.clone();
    newMaterial.roughnessMap = material.roughnessMap.clone();
    if (material.aoMap) newMaterial.aoMap = material.aoMap.clone();
    if (material.displacementMap) newMaterial.displacementMap = material.displacementMap.clone();
    return newMaterial; //
}
const topBottomMaterial = cloneMaterialWithTextures(wallMaterial); //
const leftRightMaterial = cloneMaterialWithTextures(wallMaterial); //
const allWallTextures = [
    wallMaterial.map, wallMaterial.normalMap, wallMaterial.roughnessMap, wallMaterial.displacementMap, wallMaterial.aoMap,
    topBottomMaterial.map, topBottomMaterial.normalMap, topBottomMaterial.roughnessMap, topBottomMaterial.displacementMap, topBottomMaterial.aoMap,
    leftRightMaterial.map, leftRightMaterial.normalMap, leftRightMaterial.roughnessMap, leftRightMaterial.displacementMap, leftRightMaterial.aoMap
];
allWallTextures.forEach(texture => {
    if (texture) { // Check if texture exists before setting wrap
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
    }
});

const wallGeometry = new THREE.PlaneGeometry(1, 1, 100, 100);
wallGeometry.setAttribute('uv2', new THREE.BufferAttribute(wallGeometry.attributes.uv.array, 2));

const wall = new THREE.Mesh(wallGeometry, wallMaterial); //
wall.receiveShadow = true; //
const wallThickness = 0.75;
const boxGroup = new THREE.Group(); //
scene.add(boxGroup); //
shadowBoxWalls = new THREE.Group();
boxGroup.add(shadowBoxWalls);
boxGroup.add(clockUnit); // Add the clock itself to the main group
shadowBoxWalls.add(wall); // Add the back wall to our new group

// --- REWORKED: Create placeholder meshes; geometry is now built in layoutScene() ---
const topWall = new THREE.Mesh(new THREE.BoxGeometry(), topBottomMaterial);
const bottomWall = new THREE.Mesh(new THREE.BoxGeometry(), topBottomMaterial);
const leftWall = new THREE.Mesh(new THREE.BoxGeometry(), leftRightMaterial);
const rightWall = new THREE.Mesh(new THREE.BoxGeometry(), leftRightMaterial);

[topWall, bottomWall, leftWall, rightWall].forEach(w => { //
    w.castShadow = true; //
    w.receiveShadow = true; //
    shadowBoxWalls.add(w); // Add the four side walls to our new group
});

// --- Materials for GLB parts ---
const brassMaterial = new THREE.MeshStandardMaterial({ color: 0xFFD700, metalness: 0.95, roughness: 0.1 }); //
const blackAluminumMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.6, roughness: 0.4 }); //
const lumeMaterial = new THREE.MeshStandardMaterial({ color: 0x90ee90, emissive: 0x90ee90, emissiveIntensity: 0.6, roughness: 0.8, transparent: true, opacity: 0.5 }); //
const polishedAluminumMaterial = new THREE.MeshStandardMaterial({ color: 0xe5e5e5, metalness: 0.98, roughness: 0.1 }); //
const purpleSapphireMaterial = new THREE.MeshStandardMaterial({ //
    color: 0x6A0DAD, // Deep purple color
    metalness: 0.1, //
    roughness: 0.05, //
    ior: 1.77, // Index of Refraction for sapphire
    transmission: 1.0, // Allow light to pass through
    transparent: true, //
    opacity: 0.75, //
    depthWrite: false // Helps with rendering transparent objects correctly
});


// --- GLB Model Loader ---
const gltfLoader = new GLTFLoader(loadingManager); //

function processLoadedModel(gltf) {
    clockModel = gltf.scene || gltf.scenes[0];
    if (!clockModel) {
        console.error("GLTFLoader Error: Could not find a valid scene in the GLB file.");
        return;
    }
    clockUnit.add(clockModel);
    // --- UPDATED: Position is now set in layoutScene to keep it relative to the box ---
    clockModel.position.set(0, 0, 0); 
    clockModel.rotation.set(0, 0, 0);
    clockModel.scale.set(modelScale, modelScale, modelScale);
    
    clockModel.traverse(child => {
        if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            collectedParts[child.name] = child;
        }
    });
    newHourHand = new THREE.Group();
    newMinuteHand = new THREE.Group();
    newSecondHand = new THREE.Group();
    const hourOuter = collectedParts['HourHandOuterBody'];
    const hourLume = collectedParts['HourHandLumeBody'];
    if (hourOuter) newHourHand.add(hourOuter);
    if (hourLume) newHourHand.add(hourLume);
    const minuteOuter = collectedParts['MinuteHandOuterBody'];
    const minuteLume = collectedParts['MinuteHandLumeBody'];
    if (minuteOuter) newMinuteHand.add(minuteOuter);
    if (minuteLume) newMinuteHand.add(minuteLume);
    const secondOuter = collectedParts['SecondsHandOuterBody'];
    const secondLume = collectedParts['SecondsHandLumeBody'];
    if (secondOuter) newSecondHand.add(secondOuter);
    if (secondLume) newSecondHand.add(secondLume);
    clockModel.add(newHourHand);
    clockModel.add(newMinuteHand);

    for (const name in collectedParts) {
        const part = collectedParts[name];

        if (name.startsWith('HourHandOuterBody') || name.startsWith('MinuteHandOuterBody') || name.startsWith('SecondsHandOuterBody')) { part.material = blackAluminumMaterial; }
        else if (name.startsWith('HourHandLumeBody') || name.startsWith('MinuteHandLumeBody') || name.startsWith('SecondsHandLumeBody') || name.includes('PipLumeBody')) { part.material = lumeMaterial; }
        else if (name.includes('Jewel')) {
            part.material = purpleSapphireMaterial;
        }
        else if (name === 'CaseCenterRingBody' || name === 'CaseCrownClipBase' || name === 'CaseCrownClipRing') {
            part.material = lightBrushedSteelMaterial;
        }
        else if (name === 'CaseBottomBody' || name === 'CaseTopBody') {
            part.material = mediumBrushedSteelMaterial;
        }
        else if (['BarrelBridgeBody', 'TrainWheelBridge', 'BalancingBridge'].includes(name)) {
            const material = lightBrushedSteelMaterial.clone();
            material.transparent = true;
            material.opacity = settings.bridgeTransparency;
            part.material = material;
        }
        else if ([
            'BarrelDrum_Gear_Body', 'PalletBridgeBody', 'RollerTable',
            'BalancingBridgeBody', 'TrainWheelBridgeBody'
        ].includes(name)) { 
            part.material = brushedSteelMaterial;
        }
        else if (name === 'WindingKnob') {
            part.material = lightBrushedSteelMaterial.clone();
        }
        else if (name === '6497_SkeltonFront') {
            const material = lightBrushedSteelMaterial.clone();
            material.transparent = true;
            material.opacity = settings.skeletonTopTransparency;
            part.material = material;
        }
        else if ([
            'BarrelArborBody', 'BarrelMainSpringBody', 'ClickBody', 'CrownWheelBody',
            'DriverCannonPinion_Gear_Body', 'Incabloc1_1', 'Incabloc1_Base',
            'Incabloc2_2', 'IncablocDisc_2', 'PalletForkBody', 'RatchetWheelBody',
            'RegulatorCurvePin_1', 'RegulatorCurvePin_2', 'RegulatorPiece1_Body', 'RegulatorPiece2_Body',
            'RegulatorPiece3_Body', 'SettingLeverJumperBody', 'SettingLever_Body', 'SettingWheelBody',
            'SlidingPinion', 'WindingPinion', 'WindingStem', 'YokeBody', 'YokeSpringCompressed_Body'
        ].includes(name)) { 
            part.material = polishedAluminumMaterial;
        }
        else if (name.includes('Screw')) {
            part.material = polishedAluminumMaterial;
        }
        else if (['SecondWheel', 'Minute_Wheel_Body', 'HourWheel_Body', 'EscapeWheelBody', 'CenterWheelBody', 'ThirdWheelBody', 'BalanceWheelBody', 'SecondWheelSmallGear', 'ThirdWheelTopGear', 'HairSpringBody'].includes(name) || name.includes('PipOuter')) { part.material = brassMaterial; }
    }
    const palletBridgeMesh = collectedParts['PalletBridgeBody'];
    if (palletBridgeMesh) {
        const transparentMaterial = palletBridgeMesh.material.clone();
        transparentMaterial.transparent = true;
        transparentMaterial.opacity = 0.5;
        palletBridgeMesh.material = transparentMaterial;
    }
    const partsToPivot = [ 'SecondWheel', 'Minute_Wheel_Body', 'HourWheel_Body', 'BalanceWheelBody', 'EscapeWheelBody', 'CenterWheelBody', 'ThirdWheelBody', 'HairSpringBody', 'SecondWheelSmallGear', 'ThirdWheelTopGear' ];
    
    partsToPivot.forEach(name => {
        const part = collectedParts[name];
        if (part) {
            if (name === 'HairSpringBody') {
                hairSpringMesh = part;
                const positions = part.geometry.attributes.position.array;
                const vertexCount = positions.length / 3;
                let tempVertex = new THREE.Vector3();
                part.geometry.computeBoundingBox();
                part.geometry.boundingBox.getCenter(colletOriginalPos);
                hairspringBounds.minZ = part.geometry.boundingBox.min.z;
                hairspringBounds.maxZ = part.geometry.boundingBox.max.z;
                let trueMaxRadius = 0;
                for (let i = 0; i < vertexCount; i++) {
                    tempVertex.set(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]);
                    const radius = tempVertex.distanceTo(colletOriginalPos);
                    if (radius > trueMaxRadius) {
                        trueMaxRadius = radius;
                    }
                }
                maxRadius = trueMaxRadius;

                const hairspringMaterial = part.material.clone();
                hairSpringMesh.material = hairspringMaterial;

                const hairspringUniforms = {
                    u_sineValue: { value: 0.0 },
                    u_colletOriginalPos: { value: colletOriginalPos },
                    u_maxRadius: { value: maxRadius },
                    u_hairspringBoundsZ: { value: new THREE.Vector2(hairspringBounds.minZ, hairspringBounds.maxZ) },
                    u_weightMultipliers: { value: new THREE.Vector2(hairspringAnimationSettings.bottomWeightMultiplier, hairspringAnimationSettings.topWeightMultiplier) },
                    u_maxAmplitude: { value: hairspringAnimationSettings.maxAmplitude }
                };

                hairspringMaterial.onBeforeCompile = (shader) => {
                    Object.assign(shader.uniforms, hairspringUniforms);
                    shader.vertexShader = `
                        uniform float u_sineValue;
                        uniform vec3 u_colletOriginalPos;
                        uniform float u_maxRadius;
                        uniform vec2 u_hairspringBoundsZ; // .x = minZ, .y = maxZ
                        uniform vec2 u_weightMultipliers; // .x = bottom, .y = top
                        uniform float u_maxAmplitude;
                    ` + shader.vertexShader;
                    shader.vertexShader = shader.vertexShader.replace(
                        '#include <begin_vertex>',
                        `
                        #include <begin_vertex>
                        float dist_c = distance(transformed, u_colletOriginalPos);
                        float radial_weight = dist_c / u_maxRadius;
                        float z_range = u_hairspringBoundsZ.y - u_hairspringBoundsZ.x;
                        float vertical_multiplier = 0.0;
                        if (z_range > 0.001) {
                            float normalized_z = 1.0 - ((transformed.z - u_hairspringBoundsZ.x) / z_range);
                            vertical_multiplier = mix(u_weightMultipliers.x, u_weightMultipliers.y, normalized_z);
                        }
                        float weight = clamp(radial_weight * vertical_multiplier, 0.0, 1.0);
                        float finalAmplitude = u_sineValue * u_maxAmplitude * weight;
                        vec3 displacementDirection = vec3(0.0);
                        if (dist_c > 0.001) {
                            displacementDirection = normalize(transformed - u_colletOriginalPos);
                        }
                        transformed.x += displacementDirection.x * finalAmplitude;
                        transformed.z += displacementDirection.z * finalAmplitude; 
                        `
                    );
                    hairSpringMesh.userData.shader = shader;
                };
            }
            const center = new THREE.Vector3();
            new THREE.Box3().setFromObject(part).getCenter(center);
            const pivot = new THREE.Group();
            part.parent.add(pivot);
            pivot.position.copy(center);
            pivot.add(part);
            part.position.sub(center);
            switch (name) {
                case 'SecondWheel': secondWheel = pivot; break;
                case 'Minute_Wheel_Body': minuteWheel = pivot; break;
                case 'HourWheel_Body': hourWheel = pivot; break;
                case 'BalanceWheelBody':
                    balanceWheel = pivot;
                    const rollerJewelMesh = collectedParts['RollerJewel'];
                    if (rollerJewelMesh) {
                        pivot.add(rollerJewelMesh);
                        rollerJewelMesh.position.sub(center);
                    }
                    break;
                case 'EscapeWheelBody': escapeWheel = pivot; break;
                case 'CenterWheelBody': centerWheel = pivot; break;
                case 'ThirdWheelBody': thirdWheel = pivot; break;
                case 'HairSpringBody': hairSpring = pivot; break;
                case 'SecondWheelSmallGear': secondWheelSmallGear = pivot; break;
                case 'ThirdWheelTopGear': thirdWheelTopGear = pivot; break;
            }
        }
    });

    const palletForkBodyMesh = collectedParts['PalletForkBody'];
    const palletJewelBodyMesh = collectedParts['Plate_Jewel_Body'];
    if (palletForkBodyMesh && palletJewelBodyMesh) {
        const jewelCenter = new THREE.Vector3();
        new THREE.Box3().setFromObject(palletJewelBodyMesh).getCenter(jewelCenter);
        const pivot = new THREE.Group();
        palletForkBodyMesh.parent.add(pivot);
        pivot.position.copy(jewelCenter);
        if (collectedParts['PalletForkJewel1']) pivot.add(collectedParts['PalletForkJewel1']);
        if (collectedParts['PalletForkJewel2']) pivot.add(collectedParts['PalletForkJewel2']);
        pivot.add(palletForkBodyMesh);
        pivot.children.forEach(child => child.position.sub(jewelCenter));
        palletFork = pivot;
        palletFork.rotation.z = PALLET_FORK_ANGLE * palletForkState;
    }

    if (escapeWheel) {
        escapeWheel.rotation.z = ESCAPE_WHEEL_OFFSET * palletForkState;
    }

    if (secondWheel) {
        const pivot = new THREE.Group();
        clockModel.add(pivot);
        const center = new THREE.Vector3();
        new THREE.Box3().setFromObject(secondWheel).getCenter(center);
        pivot.position.copy(center);
        pivot.add(newSecondHand);
        newSecondHand.position.sub(center);
        newSecondHand = pivot;
    }
}

function loadClockModel(quality) {
    const fileName = modelFiles[quality];
    if (!fileName) {
        console.error("Invalid model quality specified:", quality);
        return;
    }

    // --- 1. CLEANUP a previously loaded model ---
    if (clockModel) {
        clockModel.traverse(child => {
            if (child.isMesh) {
                if(child.geometry) child.geometry.dispose();
                if(child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(mat => mat.dispose());
                    } else {
                        child.material.dispose();
                    }
                }
            }
        });
        clockUnit.remove(clockModel);
    }

    // --- 2. RESET all state variables related to the model ---
    clockModel = null;
    collectedParts = {};
    secondWheel = minuteWheel = hourWheel = balanceWheel = escapeWheel = centerWheel = thirdWheel = palletFork = hairSpring = secondWheelSmallGear = thirdWheelTopGear = null;
    newHourHand = newMinuteHand = newSecondHand = null;

    // --- 3. LOAD the new model ---
    gltfLoader.setPath('textures/').load(fileName, (gltf) => {
        // --- 4. PROCESS the newly loaded model ---
        processLoadedModel(gltf);
        // --- 5. RESET the simulation state after loading ---
        _resetSimulation();
    });
}
// Initial model load
loadClockModel(settings.modelLOD);

// --- RE-USABLE VECTORS FOR ANIMATION LOOP ---
const p_orig = new THREE.Vector3(); //
const displacementDirection = new THREE.Vector3(); //

// --- Define mechanical constants for the gear train, based on a 5Hz reference beat rate ---
const TICKS_PER_SECOND_REFERENCE = 5.0;
const TICKS_PER_MINUTE = TICKS_PER_SECOND_REFERENCE * 60; // 300
const TICKS_PER_HOUR = TICKS_PER_MINUTE * 60; // 18,000
const TICKS_PER_12_HOURS = TICKS_PER_HOUR * 12; // 216,000

// --- Function to update all gear rotations based on a discrete tick ---
function updateClockGears() {
    
    // --- Single Source of Truth ---
    // ALL time/rotation is derived from the discrete tick counter.
    const totalTicks = simulationTotalTicks;
    
    // --- Calculate rotation based purely on the number of ticks that have occurred. ---
    // This decouples the clock's speed from real-world time and ties it directly to the
    // beat rate, which controls how fast ticks are generated.
    const secondHandRotation = -((totalTicks / TICKS_PER_MINUTE) * Math.PI * 2); // CCW
    const minuteHandRotation = -((totalTicks / TICKS_PER_HOUR) * Math.PI * 2); // CCW
    const hourHandRotation = -((totalTicks / TICKS_PER_12_HOURS) * Math.PI * 2); // CCW

    // --- Apply simulation rotation PLUS real-time offset to HANDS ---
    // The offset syncs the hands to the correct time on reset, and the tick-based
    // rotation then moves them forward at the simulated speed.
    if (newSecondHand) newSecondHand.rotation.z = initialSecondRotationOffset + secondHandRotation; 
    if (newMinuteHand) newMinuteHand.rotation.z = initialMinuteRotationOffset + minuteHandRotation; 
    if (newHourHand) newHourHand.rotation.z = initialHourRotationOffset + hourHandRotation; 

    // --- Apply ONLY pure simulation rotation to GEARS ---
    // This keeps the gear train mechanically synced with the escapement, which also starts at 0.
    if (secondWheel) secondWheel.rotation.z = secondHandRotation; 
    if (secondWheelSmallGear) secondWheelSmallGear.rotation.z = secondHandRotation; 
    
    if (minuteWheel) minuteWheel.rotation.z = -minuteHandRotation; // CW
    if (centerWheel) centerWheel.rotation.z = minuteHandRotation; // CCW
    
    // Third wheel rotates once every 7.5 minutes (7.5 * 300 = 2250 ticks)
    if (thirdWheel) thirdWheel.rotation.z = ((totalTicks / (TICKS_PER_MINUTE * 7.5)) * Math.PI * 2); // CW
    if (thirdWheelTopGear) thirdWheelTopGear.rotation.z = -((totalTicks / (TICKS_PER_MINUTE * 7.5)) * Math.PI * 2); // CCW

    if (hourWheel) hourWheel.rotation.z = -hourHandRotation; // CW


    // --- Escape wheel logic is already correct as it's driven by totalTicks ---
    if (escapeWheel) {
        // Base offset (from slider) is constant and does not flip.
        const baseRotation = ESCAPE_WHEEL_OFFSET; 
        
        // Escape wheel is also driven by the master totalTicks counter.
        // This ensures its 10:1 ratio with the secondWheel is ALWAYS preserved.
        const trueRotation = totalTicks * ESCAPE_WHEEL_STEP;

        // Final position is the sum of the constant base offset and the accumulated tick rotation.
        escapeWheel.rotation.z = baseRotation + trueRotation;
    }
}
// --- END ---

// --- SCENE LAYOUT AND UTILITY FUNCTIONS ---
// --- START: Added helper function to centralize camera zoom calculation ---
function calculateCameraZForZoom(zoomValue) {
    let newZ;
    if (zoomValue <= 1.0) {
        // Interpolate between fully out and standard "fit to screen" zoom.
        newZ = THREE.MathUtils.lerp(maxZoomOutDistance, maxZoomInDistance, zoomValue);
    } else {
        // Interpolate between "fit to screen" and a very close zoom level.
        const extremeZoomInDistance = 5; // A very close distance.
        // Map slider range [1.0, 2.0] to lerp t [0, 1]
        const t = zoomValue - 1.0;
        newZ = THREE.MathUtils.lerp(maxZoomInDistance, extremeZoomInDistance, t);
    }
    return newZ;
}
// --- END ---

function updateCameraZoom() {
    // --- Refactored to use the new helper function ---
    const newZ = calculateCameraZForZoom(settings.cameraZoom);
    camera.position.z = newZ;
    camera.updateProjectionMatrix();
}

function layoutScene() {
    const layoutDistance = 60.0;
    const boxFrontZ = 0.0;
    const fov = camera.fov * (Math.PI / 180);
    const fovInRadians = fov;

    // --- REWORKED: Layout Logic ---
    // 1. Determine the available screen space to calculate the box's inner dimensions.
    const innerHeight = 2 * Math.tan(fovInRadians / 2) * (layoutDistance - boxFrontZ);
    const innerWidth = innerHeight * camera.aspect;

    // 2. Build the shadow box to fit the screen.
    const boxDepth = 8.5;
    const wallCenterZ = -boxDepth / 2;
    const outerWidth = innerWidth + (2 * wallThickness);
    const outerHeight = innerHeight + (2 * wallThickness);

    wall.scale.set(outerWidth, outerHeight, 1);
    wall.position.z = -boxDepth;
    wall.rotation.set(0, 0, 0);

    if (topWall.geometry) topWall.geometry.dispose();
    if (bottomWall.geometry) bottomWall.geometry.dispose();
    if (leftWall.geometry) leftWall.geometry.dispose();
    if (rightWall.geometry) rightWall.geometry.dispose();
    
    const topGeo = new THREE.BoxGeometry(outerWidth, wallThickness, boxDepth);
    topGeo.setAttribute('uv2', new THREE.BufferAttribute(topGeo.attributes.uv.array, 2));
    topWall.geometry = topGeo;
    topWall.position.set(0, innerHeight / 2 + wallThickness / 2, wallCenterZ);
    topWall.rotation.set(0, 0, 0);

    const bottomGeo = new THREE.BoxGeometry(outerWidth, wallThickness, boxDepth);
    bottomGeo.setAttribute('uv2', new THREE.BufferAttribute(bottomGeo.attributes.uv.array, 2));
    bottomWall.geometry = bottomGeo;
    bottomWall.position.set(0, -innerHeight / 2 - wallThickness / 2, wallCenterZ);
    bottomWall.rotation.set(0, 0, 0);

    const leftGeo = new THREE.BoxGeometry(wallThickness, innerHeight, boxDepth);
    leftGeo.setAttribute('uv2', new THREE.BufferAttribute(leftGeo.attributes.uv.array, 2));
    leftWall.geometry = leftGeo;
    leftWall.position.set(-innerWidth / 2 - wallThickness / 2, 0, wallCenterZ);
    leftWall.rotation.set(0, 0, 0);
    
    const rightGeo = new THREE.BoxGeometry(wallThickness, innerHeight, boxDepth);
    rightGeo.setAttribute('uv2', new THREE.BufferAttribute(rightGeo.attributes.uv.array, 2));
    rightWall.geometry = rightGeo;
    rightWall.position.set(innerWidth / 2 + wallThickness / 2, 0, wallCenterZ);
    rightWall.rotation.set(0, 0, 0);

    // 3. Scale the clock to fit INSIDE the box's inner dimensions.
    const clockNativeDiameter = 22;
    const padding = 5;
    const availableWidth = innerWidth - (padding * 2);
    const availableHeight = innerHeight - (padding * 2);
    const scale = Math.min(availableWidth, availableHeight) / clockNativeDiameter;
    clockUnit.scale.set(scale, scale, scale);

    // 4. Set the clock's Z-position to be relative to the back wall.
    const clockOffsetFromBack = 2.25; // Moved forward 0.75 units
    clockUnit.position.z = -boxDepth + clockOffsetFromBack;

    // 5. Camera now frames the CLOCK, not the box.
    const finalClockDiameter = clockNativeDiameter * scale;

    if (camera.aspect >= 1) { // Landscape or square view
        const requiredFrustumHeight = finalClockDiameter;
        maxZoomInDistance = (requiredFrustumHeight / 2) / Math.tan(fovInRadians / 2);
    } else { // Portrait view
        const requiredFrustumWidth = finalClockDiameter;
        const requiredFrustumHeight = requiredFrustumWidth / camera.aspect;
        maxZoomInDistance = (requiredFrustumHeight / 2) / Math.tan(fovInRadians / 2);
    }
    maxZoomOutDistance = layoutDistance * 1.5;

    // --- Final Updates ---
    updateCameraZoom();
    
    const shadowVolumeBox = new THREE.Box3().setFromObject(boxGroup);
    const shadowVolumeCenter = new THREE.Vector3();
    shadowVolumeBox.getCenter(shadowVolumeCenter);
    const shadowVolumeRadius = shadowVolumeBox.getSize(new THREE.Vector3()).length() / 2;
	const paddedRadius = shadowVolumeRadius * 1.2;
    const lightPositionOffset = { x: 10, y: 28, z: 25 };
    dirLight.target.position.copy(shadowVolumeCenter);
    dirLight.position.set(
        shadowVolumeCenter.x + lightPositionOffset.x,
        shadowVolumeCenter.y + lightPositionOffset.y,
        shadowVolumeCenter.z + lightPositionOffset.z
    );
    dirLight.target.updateMatrixWorld();
    dirLight.shadow.camera.left = -paddedRadius;
    dirLight.shadow.camera.right = paddedRadius;
    dirLight.shadow.camera.top = paddedRadius;
    dirLight.shadow.camera.bottom = -paddedRadius;
    const lightDistanceToCenter = dirLight.position.distanceTo(shadowVolumeCenter);
    dirLight.shadow.camera.near = Math.max(0.1, lightDistanceToCenter - shadowVolumeRadius);
    dirLight.shadow.camera.far = lightDistanceToCenter + shadowVolumeRadius;
    dirLight.shadow.camera.updateProjectionMatrix();

    _lightPosition.copy(dirLight.position);
    _lightTargetPosition.copy(dirLight.target.position);
    Object.assign(_shadowCameraSettings, {
        left: dirLight.shadow.camera.left, right: dirLight.shadow.camera.right,
        top: dirLight.shadow.camera.top, bottom: dirLight.shadow.camera.bottom,
        near: dirLight.shadow.camera.near, far: dirLight.shadow.camera.far
    });
}

let tiltX = 0, tiltY = 0; //
function handleOrientation(event) { //
  tiltY = event.beta || 0; //
  tiltX = event.gamma || 0; //
}

function enableTilt() {
    const startTilting = () => {
        window.addEventListener('deviceorientation', handleOrientation);
    };

    if (typeof DeviceOrientationEvent?.requestPermission === 'function') {
        DeviceOrientationEvent.requestPermission().then(permissionState => {
            if (permissionState === 'granted') {
                startTilting();
            } else {
                settings.tiltEnabled = false; 
                const tiltController = gui.controllers.find(c => c.property === 'tiltEnabled');
                if (tiltController) {
                    tiltController.updateDisplay();
                }
            }
        });
    } else {
        startTilting();
    }
}

function disableTilt() {
    window.removeEventListener('deviceorientation', handleOrientation);
    tiltX = 0;
    tiltY = 0;
}
window.addEventListener('resize', () => { //
    camera.aspect = window.innerWidth / window.innerHeight; //
    renderer.setSize(window.innerWidth, window.innerHeight); //
    layoutScene(); //
});

// --- Animation Loop ---
let lastFPSTime = performance.now(); //
let frameCount = 0; //
const dateOptions = { month: '2-digit', day: '2-digit', year: '2-digit' }; //

function animate() { //
    requestAnimationFrame(animate); //

    const now = performance.now(); //
    const delta = clock.getDelta(); // This is the time in seconds since the last frame.

    // --- FPS Counter Logic ---
    frameCount++; //
    if (now >= lastFPSTime + 1000) { //
        if (settings.showFPS) { //
            fpsCounter.textContent = `FPS: ${frameCount}`; //
        }
        frameCount = 0; //
        lastFPSTime = now; //
    }

    // --- Camera Reset Animation Handler ---
    if (isResettingCamera && !isUserInteracting) { //
        const lerpFactor = Math.min(delta * 4.0, 1.0);  //
        camera.position.lerp(cameraResetTargetPos, lerpFactor); //
        controls.target.lerp(cameraResetTargetTarget, lerpFactor); //
        if (camera.position.distanceTo(cameraResetTargetPos) < 0.01) { //
            camera.position.copy(cameraResetTargetPos); //
            controls.target.copy(cameraResetTargetTarget); //
            isResettingCamera = false; //
        }
    }

    // --- Tilt Camera Logic ---
    if (settings.tiltEnabled && !isUserInteracting) {
        const maxTilt = 15; 
        const rotationMultiplier = 0.5;

        const clampedTiltX = THREE.MathUtils.clamp(tiltX, -maxTilt, maxTilt);
        const clampedTiltY = THREE.MathUtils.clamp(tiltY, -maxTilt, maxTilt);

        const targetRotY = THREE.MathUtils.degToRad(clampedTiltX) * rotationMultiplier;
        const targetRotX = THREE.MathUtils.degToRad(clampedTiltY) * rotationMultiplier;
        
        const lerpFactor = Math.min(delta * 2.0, 1.0);

        boxGroup.rotation.y = THREE.MathUtils.lerp(boxGroup.rotation.y, targetRotY, lerpFactor);
        boxGroup.rotation.x = THREE.MathUtils.lerp(boxGroup.rotation.x, targetRotX, lerpFactor);
    } else {
        const lerpFactor = Math.min(delta * 2.0, 1.0);
        if (Math.abs(boxGroup.rotation.x) > 0.0001 || Math.abs(boxGroup.rotation.y) > 0.0001) {
            boxGroup.rotation.x = THREE.MathUtils.lerp(boxGroup.rotation.x, 0, lerpFactor);
            boxGroup.rotation.y = THREE.MathUtils.lerp(boxGroup.rotation.y, 0, lerpFactor);
        } else {
            boxGroup.rotation.x = 0;
            boxGroup.rotation.y = 0;
        }
    }

    controls.update(); //

    const time = now / 1000;

    if (settings.showDateTime) {
        const elapsedSimulatedSeconds = simulationTotalTicks * (1.0 / simulationBeatRate);
        const totalDisplaySeconds = simulationStartTimeInSeconds + elapsedSimulatedSeconds;
        
        const totalSecondsInt = Math.floor(totalDisplaySeconds);

        const nowForDate = new Date();
        digitalDate.textContent = nowForDate.toLocaleDateString(undefined, dateOptions);
        
        const hours = Math.floor((totalSecondsInt / 3600) % 24);
        const minutes = Math.floor((totalSecondsInt / 60) % 60);
        const seconds = totalSecondsInt % 60;
        const formattedHours = ('0' + hours).slice(-2);
        const formattedMinutes = ('0' + minutes).slice(-2);
        const formattedSeconds = ('0' + seconds).slice(-2);
        digitalClock.textContent = `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
    }
    
    if (settings.clockRunning) {
        simulationPhysicsTime += delta; 
    } else {
        renderer.render(scene, camera); 
        return; 
    }

    if (balanceWheel) { 
        const frequency = simulationBeatRate / 2.0; 
        const sineValue = Math.sin((simulationPhysicsTime * Math.PI * 2 * frequency) + STARTING_PHASE_OFFSET); 
        const amplitudeRadians = THREE.MathUtils.degToRad(290); 
        balanceWheel.rotation.z = -amplitudeRadians * sineValue;

        const currentAngleDeg = THREE.MathUtils.radToDeg(balanceWheel.rotation.z); 
        if (balanceWheelAngles.start === null) { 
            balanceWheelAngles.start = currentAngleDeg; 
        }
        balanceWheelAngles.min = Math.min(balanceWheelAngles.min, currentAngleDeg); 
        balanceWheelAngles.max = Math.max(balanceWheelAngles.max, currentAngleDeg); 

        const currentSign = Math.sign(sineValue);
        if (currentSign !== Math.sign(previousSineValue)) {
            
            if (previousSineValue > 0 && currentSign <= 0) {
                palletForkState = -1;
            } else if (previousSineValue < 0 && currentSign >= 0) {
                palletForkState = 1;
            }

            if (palletFork) {
                const palletForkTargetAngle = (PALLET_FORK_ANGLE * palletForkState) + PALLET_FORK_OFFSET;
                palletFork.rotation.z = palletForkTargetAngle;
            }
            
            simulationTotalTicks++;
            updateClockGears();
        }
        previousSineValue = sineValue;

        if (hairSpringMesh && hairSpringMesh.userData.shader) {
            hairSpringMesh.userData.shader.uniforms.u_sineValue.value = sineValue;
        }
    }

    renderer.render(scene, camera); 
}

animate();