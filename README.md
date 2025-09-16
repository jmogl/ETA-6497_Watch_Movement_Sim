# ETA-6497_Watch_Movement_Sim
Simulation of ETA-6497 Watch Movement clock using three.js
MIT License. - Work In Progress
Jeff Miller 2025. 9/15/25

Goal of this program is to continue learning three.js and swiss watch movements!

[Click here to run the clock program!](https://jmogl.github.io/ETA-6497_Watch_Movement_Sim/)

Features:
- Simulation of ETA-6497 movement 
- HRDI lighting with pbr textures
- One tap touch or mouse click to call GUI menu
  - Variable beat rate to slow down time! (Check out the roller jewel kicking the pallet fork at slow speeds!)
      - Reset button for clock to go back to real time if slowed down
  - Level of detail for mesh, shadows, and resolution with lower settings automatic on mobile to help with FPS
  - Use mouse or touch to zoom in, single finger or mouse continuous press to rotate, and right mouse button or two fingers for pan
  - Tick sound (off by default)
  - Variable transparency for the front skeleton top and rear clock bridges

Todo:
- Finish textures
- Update the skeleton top to match screw hole positions for the movement model
- Working on a tilt mode for mobile devices to simulate a shadow box 3D effect
- Finish gear animation: working up to the third wheel
- Add option to explode parts

 References and Notes
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

Fusion 360 / Blender Notes:

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
