// revolutions per second
var angularSpeed = 0.3; 
var lastTime;
var lastConfig;
var cubies = [];
var configurations = [];
var animations = null;
var animTracker = null;
var wrapUpAnim = false;
var animStarted = false;

var worldAxes = {
	x : new THREE.Vector3(1,0,0),
	y : new THREE.Vector3(0,1,0),
	z : new THREE.Vector3(0,0,1),
}

// this function is executed on each animation frame
function animate(){
	// update
	if( animations != null ){
		if( !animStarted ){ 		//one time on animation start
			animStarted = true;
			lastTime = (new Date()).getTime();
			lastConfig = configurations[ configurations.length - 1 ];
			// console.log( 'animation started');
		}

		var time = (new Date()).getTime();
		var timeDiff = time - lastTime;
		var angleChange = angularSpeed * timeDiff * Math.PI/180;
		
		$.each(animations.set, function(i, cubie){
			if( animTracker + angleChange < animations.amt*Math.PI/2 ){
				rotateAroundWorldAxis( cubie, worldAxes[ animations.axis ] , angleChange );
			}else{
				rotateAroundWorldAxis( cubie, worldAxes[ animations.axis ], animations.amt*Math.PI/2 - animTracker );
				wrapUpAnim = true;
			}
		});


		animTracker += angleChange;

		if( wrapUpAnim ){ 		//one time on animation end

			var newConfig = $.deepCopy( lastConfig );

			var filter = {};
			filter[animations.axis] = animations.col;
			eachCubie( function(cubie, data){
				var i = data.x;
				var j = data.y;
				var k = data.z;

				if( animations.axis == 'x' ){
					newConfig[i][2-k][j] = cubie;
				}
				if( animations.axis == 'y' ){
					newConfig[k][j][2-i] = cubie;
				}
				if( animations.axis == 'z' ){
					newConfig[2-j][i][k] = cubie;
				}
			}, filter);


			configurations.push( newConfig );

			wrapUpAnim = false;
			animations = null;
			animTracker = 0;
			animStarted = false;
			// console.log( 'animation done', configurations[ configurations.length - 1 ] );

			//win condition
			if( $.deepCompare( configurations[ configurations.length - 1 ], configurations[0] ) ) console.log('win')
		}
	
		lastTime = time;

	}

	// render
	renderer.render(scene, camera);

	// request new frame
	requestAnimationFrame(function(){
		animate();
	});
}

function runAnimation( cb ){
	lastTime = (new Date()).getTime();

}

// renderer
var renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// camera
var camera = new THREE.PerspectiveCamera(20, window.innerWidth / window.innerHeight, 1, 5000);
camera.position.z = 3000;

//Auto Resize
THREEx.WindowResize(renderer, camera);

// scene
var scene = new THREE.Scene();

// lighting
var light = new THREE.AmbientLight( 0xFFFFFF );
scene.add( light );

// Create Full Cube Object
var cube = new THREE.Object3D();
cube.rotation.x += Math.PI/10;
cube.rotation.y += Math.PI/8;
scene.add( cube );

// Stickers
var red = new THREE.MeshLambertMaterial( {map: THREE.ImageUtils.loadTexture('images/stickers/red.jpg')} );
var green = new THREE.MeshLambertMaterial( {map: THREE.ImageUtils.loadTexture('images/stickers/green.jpg')} );
var white = new THREE.MeshLambertMaterial( {map: THREE.ImageUtils.loadTexture('images/stickers/white.jpg')} );
var orange = new THREE.MeshLambertMaterial( {map: THREE.ImageUtils.loadTexture('images/stickers/orange.jpg')} );
var yellow = new THREE.MeshLambertMaterial( {map: THREE.ImageUtils.loadTexture('images/stickers/yellow.jpg')} );
var blue = new THREE.MeshLambertMaterial( {map: THREE.ImageUtils.loadTexture('images/stickers/blue.jpg')} );
var blank = new THREE.MeshLambertMaterial( {map: THREE.ImageUtils.loadTexture('images/stickers/blank.jpg')} );

// Cubie Attributes
var cubeUnit = 200;	
var cubeGeometry = new THREE.CubeGeometry( cubeUnit, cubeUnit, cubeUnit );

// Create Cubies
var cubeSize = 3;
for(var i=0; i<cubeSize; i++){
	cubies[i] = [];
	for(var j=0; j<cubeSize; j++){
		cubies[i][j] = [];
		for(var k=0; k<cubeSize; k++){
			cubies[i][j][k] = createCubie( i,j,k );
		}
	}
}

// Create first configuration
configurations.push( $.deepCopy( cubies ) );


// start animation
animate();


function createCubie(x,y,z){

	var cubieGeo = cubeGeometry.clone();

	var stickers = new THREE.MeshFaceMaterial([
		x == 2 ? red : blank,
		x == 0 ? green : blank,
		y == 2 ? white : blank,
		y == 0 ? orange : blank,
		z == 2 ? yellow : blank,
		z == 0 ? blue : blank
	]);
	var cubie = new THREE.Mesh( cubieGeo, stickers );

	cubieGeo.applyMatrix( new THREE.Matrix4().makeTranslation( x * cubeUnit - cubeUnit, y * cubeUnit - cubeUnit, z * cubeUnit - cubeUnit ) );

	cubie.overdraw = true;
	cube.add(cubie);

	return cubie;
}


function eachCubie( fn, filter ){
	var count = 0;
	var cubieArr = [];
	var currentConfig = configurations[ configurations.length - 1 ];
	for(var i=0; i<3; i++){
		for(var j=0; j<3; j++){
			for(var k=0; k<3; k++){
				var cubie = currentConfig[i][j][k];

				if( (typeof filter.x == 'undefined' || filter.x == i)
				&&  (typeof filter.y == 'undefined' || filter.y == j)
				&&  (typeof filter.z == 'undefined' || filter.z == k)
				){
					fn( cubie, {'i':count, 'x':i, 'y':j, 'z':k } );
					cubieArr.push( cubie );
				}
				count++;
			}
		}
	}
	return cubieArr;
}



function triggerTurn(axis, col, amt){
	var amt = amt || 1;
	var axis = axis || 'x';
	var col = col || 0;
	var filter = {};
	filter[ axis ] = col;
	var set = eachCubie($.noop, filter);		
	animations = {set:set, axis:axis, col:col, amt:amt};
}

var rotWorldMatrix;
// Rotate an object around an arbitrary axis in world space       
function rotateAroundWorldAxis(object, axis, radians) {
    rotWorldMatrix = new THREE.Matrix4();
    rotWorldMatrix.makeRotationAxis(axis.normalize(), radians);
    rotWorldMatrix.multiply(object.matrix);                // pre-multiply
    object.matrix = rotWorldMatrix;
    object.rotation.setEulerFromRotationMatrix(object.matrix);
}


//Keyboard Controls

var dPointer = 0;
var dimensions = ['x','y','z'];

var target = {
	x: 0,
	y: 0,
	z: 0
}

var commands = {
	turnUp : function(){
		// triggerTurn(dimensions[dPointer], target[ dimensions[dPointer] ], -1 );
	},
	turnDown : function(){
		triggerTurn(dimensions[dPointer], target[ dimensions[dPointer] ]);
	},
	left : function(){
		console.log('left');
	},
	right : function(){
		console.log('right');
	},
	increase : function(){
		target[ dimensions[dPointer] ] < 2 && target[ dimensions[dPointer] ]++;
		// console.log( 'command:increase', 'dimenstion=',dimensions[dPointer], 'row=',target[ dimensions[dPointer] ])
	},
	decrease : function(){
		target[ dimensions[dPointer] ] > 0 && target[ dimensions[dPointer] ]--;
		// console.log( 'command:decrease', 'dimenstion=',dimensions[dPointer], 'row=',target[ dimensions[dPointer] ])
	},
	increaseD : function(){
		dPointer < 2 && dPointer++;
	},
	decreaseD : function(){
		dPointer > 0 && dPointer--;
	}
}
var controls = {
	119 : commands.increase, //w
	115 : commands.decrease, //s
	97 : commands.decreaseD, //a
	100 : commands.increaseD, //d
	38 : commands.turnUp, //up
	40 : commands.turnDown, //down
	13 : commands.turnDown, //enter
}
$(document).on('keypress', function(e){
	var code = ( e.which || e.keyCode )
	var command = controls[ code ];
	command && command.call( this );
	$('.x-target').removeClass('selected').addClass( dPointer == 0 && 'selected' ).text( target.x );
	$('.y-target').removeClass('selected').addClass( dPointer == 1 && 'selected' ).text( target.y );
	$('.z-target').removeClass('selected').addClass( dPointer == 2 && 'selected' ).text( target.z );
});