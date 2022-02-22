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
		this.camera = new THREE.PerspectiveCamera( 60, window.innerWidth / (window.innerHeight - document.getElementsByClassName("optionContainer")[0].clientHeight - document.getElementsByClassName("colorContainer")[0].clientHeight), 0.1, 100 );
		this.camera.position.set( 0, 1, 2 );
        
        // SCENE
		this.scene = new THREE.Scene();

        // LIGHT
        const ambient = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
        ambient.position.set( 0.5, 1, 0.25 );
		this.scene.add(ambient)

			
        // RENDERER
		this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true } );
		this.renderer.setPixelRatio( window.devicePixelRatio );
		this.renderer.setSize( window.innerWidth, window.innerHeight - document.getElementsByClassName("optionContainer")[0].clientHeight - document.getElementsByClassName("colorContainer")[0].clientHeight);
        this.renderer.outputEncoding = THREE.sRGBEncoding;
		container.appendChild( this.renderer.domElement );

        this.setEnvironment();
        // this.initAR();

        // POSITION CIRCLE
        this.reticle = new THREE.Mesh(
            new THREE.RingBufferGeometry( 0.15, 0.2, 32 ).rotateX( - Math.PI / 2 ),
            new THREE.MeshBasicMaterial()
        );
        
        this.reticle.matrixAutoUpdate = false;
        this.reticle.visible = false;
        this.scene.add( this.reticle );
        

        // TEXTURE
        this.textureLoader = new THREE.TextureLoader();
        this.textures = [];
        this.texturesRotated = [];
        this.materialNb = 0;

        for (var i = 1; i < 30; i++) {
            this.textures.push(this.textureLoader.load( 'textures/' + i + '.jpg' , function ( texture ) {
                texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
            }));
        }


        // OTHER
        this.controls = new OrbitControls( this.camera, this.renderer.domElement );
        this.controls.target.set(0, 0, 0);
        this.controls.update();
        

        this.setupXR();
        if (!this.desk) {
            this.fileLoader.load( 'app.json', this.addObjectFromJson.bind(this));
        }
    
        window.addEventListener('resize', this.resize.bind(this) );
        this.createColorElements();
	}	
    
    addObjectFromJson ( text ) {
        let json = JSON.parse( text);
        this.desk = this.loader.parse( json.object );

        this.updateUV( this.desk );
        
        this.scene.add(this.desk);
        this.scene.background = new THREE.Color( 0xdddddd );

        // Add Additional features to Desk
        this.defineElementDim(this.desk);
        for (let element of this.desk.children) {
            if (element.name === 'Blat') {
                this.addEdgeTypesToElement(element, 's20', 's20', 's20', 's20');
            } else {
                this.addEdgeTypesToElement(element);
            }
        }

        this.desk.position.set( 0, 0, 0 );
        if (this.desk) {
            // console.log('addObjectFromJson');
            this.originalWrapBox = new THREE.Box3().setFromObject( this.desk );
            this.originalObjectDimm = this.originalWrapBox.max.subVectors(this.originalWrapBox.max, this.originalWrapBox.min);
        }
        // this.setupXR.bind(this);
        const btn = new ARButton( this.renderer, this);

        this.updateArea( this.desk);
        this.updateEdgeLength( this.desk);
        this.applyEdgeOverhead( this.desk,
                                        { 's6' : 1.2,
                                        's20' : 1.2 });
        this.addComponents( this.desk, 
                        { 'stopki-0.5' : 4 });
        this.updatePrice( this.desk, 
                        { 's6' : 0.5,
                            's20' : 1.5 },
                        { 'stopki-0.5' : 0.5 });
    }

    // Problem może się pojawić jak formatka będzię niższa, lub krótsza niż dłuższa
    defineElementDim ( object ) {
        for (let element of object.children) {
            let oldDim = {};
            oldDim.x = element.geometry.parameters.width;
            oldDim.y = element.geometry.parameters.height;
            oldDim.z = element.geometry.parameters.depth;

            // sort items by value
            var sortDimArray = [];
            for (var dim in oldDim) {
                sortDimArray.push([dim, oldDim[dim]]);
            }
            sortDimArray.sort(function(a, b) {
                return b[1] - a[1];
            });

            element.dimensionsDefault = {};
            element.dimensionsDefault.width = sortDimArray[0];
            element.dimensionsDefault.height = sortDimArray[1];
            element.dimensionsDefault.thickness = sortDimArray[2];
        }

    }

    addEdgeTypesToElement ( element, widthBottom = 's6',  widthTop ='s6', heightLeft ='s6', heightRight ='s6') {
        element.edgeTypes = {};
        element.edgeTypes.width = {};
        element.edgeTypes.height = {};
        element.edgeTypes.width.bottom = widthBottom;
        element.edgeTypes.width.top = widthTop;
        element.edgeTypes.height.left = heightLeft;
        element.edgeTypes.height.right = heightRight;
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

        

        // const btn = new ARButton( this.renderer);

        this.controller = this.renderer.xr.getController(0);
        this.controller.addEventListener( 'select', this.onSelect.bind(this) );
        this.scene.add(this.controller);

        this.renderer.setAnimationLoop( this.render.bind(this) );
    }

    resize(){
        this.camera.aspect = window.innerWidth / (window.innerHeight - document.getElementsByClassName("optionContainer")[0].clientHeight - document.getElementsByClassName("colorContainer")[0].clientHeight);
        this.camera.updateProjectionMatrix();
        this.renderer.setSize( window.innerWidth, window.innerHeight - document.getElementsByClassName("optionContainer")[0].clientHeight - document.getElementsByClassName("colorContainer")[0].clientHeight);  
    }


    onSelect() {
        if (this.reticle.visible){ 
            if (this.desk) {
                this.desk.visible = true;
                this.desk.position.setFromMatrixPosition( this.reticle.matrix );
            } 
        }
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
            // console.log(positionChange);

            for (let element of object.children) {
                // Scale
                if (element.geometry.parameters.width > maxBoardThickness) {
                    element.geometry.elementNewXSize = element.geometry.parameters.width + widthChangeFromOrig;
                    let scaleFactorX = element.geometry.elementNewXSize / element.geometry.parameters.width;
                    element.scale.x = scaleFactorX;
                // Position
                } else {
                    if (element.position.x > maxBoardThickness/2) {
                        element.position.x += positionChange;
                    } else if (element.position.x < (maxBoardThickness/2 - maxBoardThickness)) {
                        element.position.x -= positionChange;
                    }
                }
            }
        }
    }


    setDepth( object, zSize) {
        let maxBoardThickness = 0.06;

        // Scale
        let depthChangeFromOrig = zSize - this.originalObjectDimm.z;

        // Position
        let box = new THREE.Box3().setFromObject( object );
        let objectDimm = box.max.subVectors(box.max, box.min);
        let depthChange = zSize - objectDimm.z;
        
        if (depthChange.toFixed(2) != 0) {
            let positionChange = depthChange / 2;
            // console.log(positionChange);

            for (let element of object.children) {
                // Scale
                if (element.geometry.parameters.depth > maxBoardThickness) {
                    element.geometry.elementNewZSize = element.geometry.parameters.depth + depthChangeFromOrig;
                    let scaleFactorZ = element.geometry.elementNewZSize / element.geometry.parameters.depth;
                    element.scale.z = scaleFactorZ;
                // Position
                } else {
                    if (element.position.z > maxBoardThickness/2) {
                        element.position.z += positionChange;
                    } else if (element.position.z < (maxBoardThickness/2 - maxBoardThickness)) {
                        element.position.z -= positionChange;
                    }
                }
            }
        }
    }


    setHeight( object, ySize) {
        let maxBoardThickness = 0.06;

        // Scale
        let heightChangeFromOrig = ySize - this.originalObjectDimm.y;

        // Position
        let box = new THREE.Box3().setFromObject( object );
        let objectDimm = box.max.subVectors(box.max, box.min);
        let heightChange = ySize - objectDimm.y;
        
        if (heightChange.toFixed(2) != 0) {
            let positionChange = heightChange / 2;
            // console.log(positionChange);

            for (let element of object.children) {
                // Scale
                if (element.geometry.parameters.height > maxBoardThickness) {
                    element.geometry.elementNewYSize = element.geometry.parameters.height + heightChangeFromOrig;
                    let scaleFactorY = element.geometry.elementNewYSize / element.geometry.parameters.height;
                    element.scale.y = scaleFactorY;
                // Position
                } else {
                    if (element.position.y > maxBoardThickness/2) {
                        element.position.y += positionChange;
                    } else if (element.position.z < (maxBoardThickness/2 - maxBoardThickness)) {
                        element.position.y -= positionChange;
                    }
                }
            }
        }
    }


    // UPDATE WIDTH

    updateWidth( sliderValue ) {
        this.setWidth(this.desk, sliderValue/100);
        this.updateArea( this.desk);
        this.updateEdgeLength( this.desk);
        this.applyEdgeOverhead( this.desk,
                                        { 's6' : 1.2,
                                        's20' : 1.2 });
        this.updatePrice( this.desk, 
                                    { 's6' : 0.5,
                                    's20' : 1.5 },
                                    { 'stopki-0.5' : 0.5 });
    }


    updateDepth( sliderValue ) {
        this.setDepth(this.desk, sliderValue/100);
        this.updateArea( this.desk);
        this.updateEdgeLength( this.desk);
        this.applyEdgeOverhead( this.desk,
                                        { 's6' : 1.2,
                                        's20' : 1.2 });
        this.updatePrice( this.desk, 
                                    { 's6' : 0.5,
                                    's20' : 1.5 },
                                    { 'stopki-0.5' : 0.5 });
    }


    updateHeight( sliderValue ) {
        this.setHeight(this.desk, sliderValue/100);
        this.updateArea( this.desk);
        this.updateEdgeLength( this.desk);
        this.applyEdgeOverhead( this.desk,
                                        { 's6' : 1.2,
                                        's20' : 1.2 });
        this.updatePrice( this.desk, 
                                    { 's6' : 0.5,
                                    's20' : 1.5 },
                                    { 'stopki-0.5' : 0.5 });
    }

    // SET TEXTURE UV DIRECTION AND SCALE

    updateUV( object ) {

        for (let element of object.children) {
            this.updateUVEdgeTextures(element);
            this.updateUVTextureRotation(element);
        }

    }


    updateUVTextureRotation( element ) {
        if (element.textureDirection === undefined) {

            let uvAttribute = element.geometry.attributes.uv;

            let elemHeight = element.geometry.parameters.height;
            let elemDepth = element.geometry.parameters.depth;
            let elemWidth = element.geometry.parameters.width;

            if (elemWidth > elemDepth && elemWidth > elemHeight ) {
                if ( elemDepth > elemHeight ) {
                    for ( var i = 0; i < uvAttribute.count; i ++ ) {
                        if (Math.floor( ( i ) / 4) == 2 ||  Math.floor( ( i ) / 4) == 3) {
                            this.rotateUV( i, uvAttribute );
                        }
                    }
                } else {
                    for ( var i = 0; i < uvAttribute.count; i ++ ) {
                        if (Math.floor( ( i ) / 4) == 4 ||  Math.floor( ( i ) / 4) == 5) {
                            this.rotateUV( i, uvAttribute );
                        }
                    }
                }
            }


            if (elemDepth > elemWidth && elemDepth > elemHeight ) {
                if ( elemHeight > elemWidth ) {
                    for ( var i = 0; i < uvAttribute.count; i ++ ) {
                        if (Math.floor( ( i ) / 4) == 0 ||  Math.floor( ( i ) / 4) == 1) {
                            this.rotateUV( i, uvAttribute );
                        }
                    }
                }
            }
        }
    }

    updateUVEdgeTextures( element ) {
        
        let uvAttribute = element.geometry.attributes.uv;

        let elemHeight = element.geometry.parameters.height;
        let elemDepth = element.geometry.parameters.depth;
        let elemWidth = element.geometry.parameters.width;

        if (elemHeight < elemDepth && elemHeight < elemWidth) {
            for ( var i = 0; i < uvAttribute.count; i ++ ) {
                if (Math.floor( ( i ) / 4) != 2 &&  Math.floor( ( i ) / 4) != 3) {
                    this.rotateUV( i, uvAttribute );
                    this.scaleUVEdge( i, uvAttribute );
                }
            }
        }

        if (elemDepth < elemHeight && elemDepth < elemWidth) {
            for ( var i = 0; i < uvAttribute.count; i ++ ) {
                if (Math.floor( ( i ) / 4) == 2 ||  Math.floor( ( i ) / 4) == 3) {
                    this.rotateUV( i, uvAttribute );
                    this.scaleUVEdge( i, uvAttribute );
                }
                else if (Math.floor( ( i ) / 4) == 0 ||  Math.floor( ( i ) / 4) == 1) {
                    this.scaleUVEdge( i, uvAttribute );
                }
            }
        }

        if (elemWidth < elemDepth && elemWidth < elemHeight) {
            for ( var i = 0; i < uvAttribute.count; i ++ ) {
                if (Math.floor( ( i ) / 4) != 0 &&  Math.floor( ( i ) / 4) != 1) {
                    this.scaleUVEdge( i, uvAttribute );
                }
            }
        }
    }

    scaleUVEdge( i, uvAttribute ) {
        var u = uvAttribute.getX( i );
        var v = uvAttribute.getY( i );
        u = u * (0.125 / 5);
        uvAttribute.setXY( i, u, v );
    }

    rotateUV( i, uvAttribute ) {
        let vertexNb = i % 4;

        switch (vertexNb) {
            case 0:
                uvAttribute.setXY( i, 1, 1 );
                break;
            case 1:
                uvAttribute.setXY( i, 1, 0 );
                break;
            case 2:
                uvAttribute.setXY( i, 0, 1 );
                break;
            case 3:
                uvAttribute.setXY( i, 0, 0 );
                break;
        }
    }


    // COUNT AREA, CURRENT DIMENSIONS

    updateArea( object ) {
        object.area = 0;
        let maxBoardThickness = 0.06;
        for (let element of object.children) {
            element.dimensions = {};
            element.area = 0;
            let width = element.dimensionsDefault.width[1];
            let height = element.dimensionsDefault.height[1];
            let thickness = element.dimensionsDefault.thickness[1];
            element.dimensions.width = [element.dimensionsDefault.width[0], Number((width * element.scale[element.dimensionsDefault.width[0]]).toFixed(2))];
            element.dimensions.height = [element.dimensionsDefault.height[0], Number((height * element.scale[element.dimensionsDefault.height[0]]).toFixed(2))];
            element.dimensions.thickness = [element.dimensionsDefault.thickness[0], Number((thickness * element.scale[element.dimensionsDefault.thickness[0]]).toFixed(2))];
            element.area = element.dimensions.width[1] * element.dimensions.height[1];
            object.area += element.area;
        }
    }

    // COUNT EDGES

    updateEdgeLength( object ) {
        object.edges = {};
        for (let element of object.children) {
            // Height
            for (let side in element.edgeTypes.height) {
                let edgeType = element.edgeTypes.height[side];
                if (Object.keys(object.edges).includes(edgeType)) {
                    object.edges[edgeType] += parseFloat(element.dimensions.height[1].toFixed(2));
                    object.edges[edgeType] = parseFloat(object.edges[edgeType].toFixed(2));
                } else {
                    object.edges[edgeType] = 0;
                    object.edges[edgeType] = parseFloat(element.dimensions.height[1].toFixed(2));
                }
            }
            // Width
            for (let side in element.edgeTypes.width) {
                let edgeType = element.edgeTypes.width[side];
                if (Object.keys(object.edges).includes(edgeType)) {
                    object.edges[edgeType] += parseFloat(element.dimensions.width[1].toFixed(2));
                    object.edges[edgeType] = parseFloat(object.edges[edgeType].toFixed(2));
                } else {
                    object.edges[edgeType] = 0;
                    object.edges[edgeType] = parseFloat(element.dimensions.width[1].toFixed(2));
                }
            }
        }
    }


    applyEdgeOverhead( object, overheads = {} ) {
        if (overheads) {
            // let amount = 0;
            for (let edgeType in object.edges) {
                if (Object.keys(overheads).includes(edgeType)) {
                    object.edges[edgeType] = overheads[edgeType] * object.edges[edgeType];
                    object.edges[edgeType] = parseFloat(object.edges[edgeType].toFixed(2));
                }
            }
        }
    }

    // COUNT PRICES

    updatePrice( object, edgePrices, componentPrices ) {
        let price = (object.area * 1.1 * 25 + object.area * 1.1 * 15 + this.countEdgePrices( object, edgePrices ) + this.countComponentCosts( object, componentPrices )) * 2.9;
        var priceElement = document.getElementById("price");
        priceElement.innerHTML = price.toFixed(2);
    }


    countEdgePrices( object, edgePrices ) {
        let amount = 0;
        for (let edgeType in object.edges) {
            if (Object.keys(edgePrices).includes(edgeType)) {
                amount += edgePrices[edgeType] * object.edges[edgeType];
            } else {
                alert('Error - price for Edge Type' + edgeType + ' not provided by the system');
            }
        }
        amount = parseFloat(amount.toFixed(2));
        return amount;
    }


    // COMPONENTS

    addComponents ( object, componentToAdd ) {
        object.components = {};
        for (let component in componentToAdd) {
            object.components[component] = componentToAdd[component];
        }
    }


    countComponentCosts( object, componentPrices ) {
        let amount = 0;
        for (let compType in object.components) {
            if (Object.keys(componentPrices).includes(compType)) {
                amount += componentPrices[compType] * object.components[compType];
            } else {
                alert('Error - price for Edge Type' + compType + ' not provided by the system');
            }
        }
        amount = parseFloat(amount.toFixed(2));
        return amount;
    }


    // CREATING COLOR ELEMENTS, CHANGING COLORS

    createColorElements() {
        for (var i = 1; i < 30; i++) {
            var newColorDiv = document.createElement("div");
            newColorDiv.classList.add('color');
            newColorDiv.innerHTML = "<img src='textures/" + i + ".jpg' alt='" + (i-1) + "' onclick='myFunction(this);'>";
            document.getElementById("colorContainer").appendChild(newColorDiv);
        }
    }

    changeColor(colorId) {
        for (var i = 0; i < 4; i++) {
            let texture = this.textures[colorId];
            this.desk.children[i].material.map = texture;
        }
    }

}

export { App };