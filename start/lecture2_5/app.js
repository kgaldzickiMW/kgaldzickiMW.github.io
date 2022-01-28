import * as THREE from '../../libs/three/three.module.js';
import { OrbitControls } from '../../libs/three/jsm/OrbitControls.js';

class App{
	constructor(){
		const container = document.createElement( 'div' );
		document.body.appendChild( container );

        // LOADER
        this.fileLoader = new THREE.FileLoader();
        this.loader = new THREE.ObjectLoader();
        
        // CAMERA
		this.camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 0.1, 100 );
		this.camera.position.set( 0, 0, 4 );
        
        // SCENE
		this.scene = new THREE.Scene();
        var scene;
        // this.scene.background = new THREE.Color( 0xaaaaaa );

        // // LIGHTS
		// const ambient = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 0.3);
		// this.scene.add(ambient);
        
        // const light = new THREE.DirectionalLight();
        // light.position.set( 0.2, 1, 1);
        // this.scene.add(light);
			
        // RENDERER
		this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true } );
		this.renderer.setPixelRatio( window.devicePixelRatio );
		this.renderer.setSize( window.innerWidth, window.innerHeight );
		container.appendChild( this.renderer.domElement );
		
        // // MODEL
        // const geometry = new THREE.TorusKnotBufferGeometry( 0.8, 0.3, 120, 16 ); 
        
        // const material = new THREE.MeshPhongMaterial( { color: 0xff00ff, specular: 0x444444, shininess: 60 } );

        // this.mesh = new THREE.Mesh( geometry, material );
        
        this.fileLoader.load( 'app.json', this.setScene.bind(this)); 
        //     let json = JSON.parse( text);
        //     console.log(this);
        //     this.loader = new THREE.ObjectLoader();
        //     scene = this.loader.parse( json.scene );
        //     return scene;
        // });

        console.log(this.scene);
        // console.log(this);
        // this.scene = scene;
        
        // this.object = this.loader.parse( this.json_object.scene );

        // ADD MODEL
        // this.scene.add(this.object);
        

        // OTHER
        const controls = new OrbitControls( this.camera, this.renderer.domElement );
        
        this.renderer.setAnimationLoop(this.render.bind(this));
    
        window.addEventListener('resize', this.resize.bind(this) );
	}	
    
    setScene ( text ) {
        let json = JSON.parse( text);
        this.scene = this.loader.parse( json.scene );
        this.scene.background = new THREE.Color( 0x777777 );
        this.originalWrapBox = new THREE.Box3().setFromObject( this.scene.children[0] );
        this.originalObjectDimm = this.originalWrapBox.max.subVectors(this.originalWrapBox.max, this.originalWrapBox.min);
        // console.log(this);
    }
        

    resize(){
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize( window.innerWidth, window.innerHeight );  
    }
    
	render( ) {   
        // console.log(this.scene)
        this.renderer.render( this.scene, this.camera );
    }

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
        
        // let scaleFactorX, scaleFactorY, scaleFactorZ;
        // scaleFactorX = xSize / Mesh.geometry.parameters.width;
        // scaleFactorY = ySize / Mesh.geometry.parameters.height;
        // scaleFactorZ = zSize / Mesh.geometry.parameters.depth;
        // Mesh.scale.set( scaleFactorX, scaleFactorY, scaleFactorZ );
    }

    clickAction( ) {

        // this.scene.children[0].children[0].scale.x += 0.02;
        var slider = document.getElementById("myRange");
        console.log(slider.value);
        this.setWidth.bind(this, this.scene.children[0], 1.40);
        // this.setSize(this.scene.children[0].children[0], 1.40, 0.018, 0.7);
        // this.setSize(this.scene.children[0].getObjectByName('Facha'), (1.40-0.036));
        // var xSize, ySize, zSize;
        // xSize = ySize = zSize = 1.2;
        // let blat = this.scene.children[0].children[0];
        // let scaleFactorX = xSize / blat.geometry.parameters.width;
        // let scaleFactorY = ySize / blat.geometry.parameters.height;
        // let scaleFactorZ = zSize / blat.geometry.parameters.depth;
        // console.log(scaleFactorX, scaleFactorY, scaleFactorZ);
        // console.log(this.scene.children[0].children[0].geometry.parameters);
        // console.log(this.scene.children[0]);
        // this.scene.background = new THREE.Color( 0x000000 );
        // this.scene.background = new THREE.Color( 0x000000 );

    }

    updateWidth( sliderValue ) {
        this.setWidth(this.scene.children[0], sliderValue/100);
    }

}

export { App };