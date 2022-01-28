import * as THREE from '../../libs/three/three.module.js';
import { OrbitControls } from '../../libs/three/jsm/OrbitControls.js';

class App{
	constructor(){
		const container = document.createElement( 'div' );
		document.body.appendChild( container );

        // LOADER
        this.fileLoader = new THREE.FileLoader();
        // this.loader = new THREE.ObjectLoader();
        
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
        
        this.scene = this.fileLoader.load( 'app.json', function ( text ) {
            let json = JSON.parse( text);
            console.log(json.scene);
            this.loader = new THREE.ObjectLoader();
            scene = this.loader.parse( json.scene );
            return scene;
        });

        console.log(this.scene);
        // this.scene = scene;
        
        // this.object = this.loader.parse( this.json_object.scene );

        // ADD MODEL
        // this.scene.add(this.object);
        

        // OTHER
        const controls = new OrbitControls( this.camera, this.renderer.domElement );
        
        this.renderer.setAnimationLoop(this.render.bind(this));
    
        window.addEventListener('resize', this.resize.bind(this) );
	}	
    
    // load ( json ) {
    //     console.log(json);
    //     this.scene = this.loader.parse( json.scene );
    // }
        

    resize(){
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize( window.innerWidth, window.innerHeight );  
    }
    
	render( ) {   
        // this.mesh.rotateY( 0.01 );
        this.renderer.render( this.scene, this.camera );
    }
}

export { App };