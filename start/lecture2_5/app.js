import * as THREE from '../../libs/three125/three.module.js';
import { OrbitControls } from '../../libs/three125/OrbitControls.js';
import { RGBELoader } from '../../libs/three/jsm/RGBELoader.js';
import { Stats } from '../../libs/stats.module.js';
import { ARButton } from '../../libs/ARButton.js';

class App{
	constructor(){
		const container = document.createElement( 'div' );
		document.body.appendChild( container );

        // LOADER
        this.fileLoader = new THREE.FileLoader();
        this.loader = new THREE.ObjectLoader();
        
        // CAMERA
		this.camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 0.1, 100 );
		this.camera.position.set( 0, 1.6, 0 );
        
        // SCENE
		this.scene = new THREE.Scene();

        // LIGHT
        const ambient = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
        ambient.position.set( 0.5, 1, 0.25 );
		this.scene.add(ambient)

			
        // RENDERER
		this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true } );
		this.renderer.setPixelRatio( window.devicePixelRatio );
		this.renderer.setSize( window.innerWidth, window.innerHeight );
        this.renderer.outputEncoding = THREE.sRGBEncoding;
		container.appendChild( this.renderer.domElement );

        this.setEnvironment();
        this.initAR();

        // POSITION CIRCLE
        this.reticle = new THREE.Mesh(
            new THREE.RingBufferGeometry( 0.15, 0.2, 32 ).rotateX( - Math.PI / 2 ),
            new THREE.MeshBasicMaterial()
        );
        
        this.reticle.matrixAutoUpdate = false;
        this.reticle.visible = false;
        this.scene.add( this.reticle );
        

        // OTHER
        this.controls = new OrbitControls( this.camera, this.renderer.domElement );
        this.controls.target.set(0, 3.5, 0);
        this.controls.update();
        

        this.setupXR();
    
        window.addEventListener('resize', this.resize.bind(this) );
	}	
    
    addObjectFromJson ( text ) {
        console.log('test');
        let json = JSON.parse( text);
        this.desk = this.loader.parse( json.object );
        this.scene.add(this.desk);
        this.desk.position.setFromMatrixPosition( this.reticle.matrix );
        // this.objectNumber = this.scene.children.length - 1;
        // this.scene.add( json.scene );
        // this.scene.children[0].position.set(0, -1, -0.5);
        if (this.desk) {
            this.originalWrapBox = new THREE.Box3().setFromObject( this.desk );
            this.originalObjectDimm = this.originalWrapBox.max.subVectors(this.originalWrapBox.max, this.originalWrapBox.min);
        }
    }

    

    setupXR(){
        this.renderer.xr.enabled = true;
        
        //TO DO 1: If navigator includes xr and immersive-ar is supported then show the ar-button class
        if ('xr' in navigator) {
            navigator.xr.isSessionSupported( 'immersive-ar' ).then( (supported)=>{
                if (supported) {
                    const collection = document.getElementsByClassName("ar-button");
                    [...collection].forEach( el => {
                        el.style.display = 'block';
                    })
                }
            })
        }

        const self = this;

        this.hitTestSourceRequested = false;
        this.hitTestSource = null;

        

        const btn = new ARButton( this.renderer );

        this.controller = this.renderer.xr.getController(0);
        this.controller.addEventListener( 'select', this.onSelect.bind(this) );
        this.scene.add(this.controller);

        this.renderer.setAnimationLoop( this.render.bind(this) );
    }

    resize(){
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize( window.innerWidth, window.innerHeight );  
    }


    onSelect() {
        // const material = new THREE.MeshPhongMaterial( { color: 0xFFFFFF * Math.random( )});
        // const mesh = new THREE.Mesh( self.geometry, material );
        // mesh.position.set(0, 0, -0.3).applyMatrix4( controller.matrixWorld );
        // mesh.quaternion.setFromRotationMatrix( controller.matrixWorld );
        // console.log(this);
        // this.desk = this.scene.children[0]
        console.log(this);
        if (this.reticle.visible){ 
            console.log('test3');
            console.log(this.desk);
            if (this.desk) {
                console.log('test4');
                this.desk.position.setFromMatrixPosition( this.reticle.matrix );
                } else {
                    console.log('test5');
                    this.fileLoader.load( 'app.json', this.addObjectFromJson.bind(this));
                    // this.desk.position.setFromMatrixPosition( this.reticle.matrix );
                }
                // this.desk.positionChange.set(0, -1, -1.5).applyMatrix4( this.controller.matrixWorld );
            }


        // self.scene.add(mesh);
        // self.meshes.push(mesh);
    }
        
    
	setEnvironment(){
        const loader = new RGBELoader().setDataType( THREE.UnsignedByteType );
        const pmremGenerator = new THREE.PMREMGenerator( this.renderer );
        pmremGenerator.compileEquirectangularShader();
        
        const self = this;
        
        loader.load( '../../assets/hdr/venice_sunset_1k.hdr', ( texture ) => {
          const envMap = pmremGenerator.fromEquirectangular( texture ).texture;
          pmremGenerator.dispose();

          self.scene.environment = envMap;

        }, undefined, (err)=>{
            console.error( 'An error occurred setting the environment');
        } );
    }
    
	// showChair(id){
    //     this.initAR();
        
	// 	const loader = new GLTFLoader( ).setPath(this.assetsPath);
    //     const self = this;
        
    //     this.loadingBar.visible = true;
		
	// 	// Load a glTF resource
	// 	loader.load(
	// 		// resource URL
	// 		`chair${id}.glb`,
	// 		// called when the resource is loaded
	// 		function ( gltf ) {

	// 			self.scene.add( gltf.scene );
    //             self.chair = gltf.scene;
        
    //             self.chair.visible = false; 
                
    //             self.loadingBar.visible = false;
                
    //             self.renderer.setAnimationLoop( self.render.bind(self) );
	// 		},
	// 		// called while loading is progressing
	// 		function ( xhr ) {

	// 			self.loadingBar.progress = (xhr.loaded / xhr.total);
				
	// 		},
	// 		// called when loading has errors
	// 		function ( error ) {

	// 			console.log( 'An error happened' );

	// 		}
	// 	);
	// }			
    
    initAR(){
        //TO DO 2: Start an AR session
        let currentSession = null;
        const self = this;

        const sessionInit = { requiredFeatures: ['hit-test']};

        function onSessionStarted( session ){
            session.addEventListener( 'end', onSessionEnded );

            self.renderer.xr.setReferenceSpaceType( 'local' );
            self.renderer.xr.setSession( session );

            currentSession = session;
        }

        function onSessionEnded() {
            currentSession.removeEventListener( 'end', onSessionEnded );
            currentSession = null;

            if (self.desk !== null) {
                self.scene.remove( self.desk );
                self.desk = null;
            }

            self.renderer.setAnimationLoop( null );
        }

        navigator.xr.requestSession( 'immersive-ar', sessionInit ).then(onSessionStarted)
    }
    
    requestHitTestSource(){
        const self = this;
        
        const session = this.renderer.xr.getSession();

        session.requestReferenceSpace( 'viewer' ).then( function ( referenceSpace ) {
            
            session.requestHitTestSource( { space: referenceSpace } ).then( function ( source ) {

                self.hitTestSource = source;

            } );

        } );

        session.addEventListener( 'end', function () {

            self.hitTestSourceRequested = false;
            self.hitTestSource = null;
            self.referenceSpace = null;

        } );

        this.hitTestSourceRequested = true;

    }
    
    getHitTestResults( frame ){
        const hitTestResults = frame.getHitTestResults( this.hitTestSource );

        if ( hitTestResults.length ) {
            
            const referenceSpace = this.renderer.xr.getReferenceSpace();
            const hit = hitTestResults[ 0 ];
            const pose = hit.getPose( referenceSpace );

            this.reticle.visible = true;
            this.reticle.matrix.fromArray( pose.transform.matrix );

        } else {

            this.reticle.visible = false;

        }

    }
    
	render( timestamp, frame ) {

        if ( frame ) {
            if ( this.hitTestSourceRequested === false ) this.requestHitTestSource( )

            if ( this.hitTestSource ) this.getHitTestResults( frame );
        }

        this.renderer.render( this.scene, this.camera );

    }



    // RESIZE FUNCTIONS --------------------------------------------------------------------------------------------------------------

    setSize( Mesh, xSize, ySize=Mesh.geometry.parameters.height, zSize=Mesh.geometry.parameters.depth) {
        let scaleFactorX, scaleFactorY, scaleFactorZ;
        scaleFactorX = xSize / Mesh.geometry.parameters.width;
        scaleFactorY = ySize / Mesh.geometry.parameters.height;
        scaleFactorZ = zSize / Mesh.geometry.parameters.depth;
        Mesh.scale.set( scaleFactorX, scaleFactorY, scaleFactorZ );
    }


    setWidth( object, xSize) {
        let maxBoardThickness = 0.06;

        // Scale
        let widthChangeFromOrig = xSize - this.originalObjectDimm.x;

        // Position
        let box = new THREE.Box3().setFromObject( object );
        let objectDimm = box.max.subVectors(box.max, box.min);
        let widthChange = xSize - objectDimm.x;
        
        if (widthChange.toFixed(2) != 0) {
            let positionChange = widthChange/2;
            console.log(positionChange);

            for (let mesh of object.children) {
                // Scale
                if (mesh.geometry.parameters.width > maxBoardThickness) {
                    let meshNewXSize = mesh.geometry.parameters.width + widthChangeFromOrig;
                    let scaleFactorX = meshNewXSize / mesh.geometry.parameters.width;
                    mesh.scale.x = scaleFactorX;
                // Position
                } else {
                    if (mesh.position.x > maxBoardThickness/2) {
                        mesh.position.x += positionChange;
                    } else if (mesh.position.x < (maxBoardThickness/2 - maxBoardThickness)) {
                        mesh.position.x -= positionChange;
                    }
                }
            }
        }
    }

    clickAction( ) {

        var slider = document.getElementById("myRange");
        console.log(slider.value);
        this.setWidth.bind(this, this.scene.children[0], 1.40);

    }

    updateWidth( sliderValue ) {
        this.setWidth(this.scene.children[0], sliderValue/100);
    }

}

export { App };