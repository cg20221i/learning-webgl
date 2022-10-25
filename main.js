function main() {
    var canvas = document.getElementById("myCanvas");
    var gl = canvas.getContext("webgl");

    var vertices = [
        // Face A       // Red
        -1, -1, -1,     1, 0, 0,    // Index:  0    
         1, -1, -1,     1, 0, 0,    // Index:  1
         1,  1, -1,     1, 0, 0,    // Index:  2
        -1,  1, -1,     1, 0, 0,    // Index:  3
        // Face B       // Yellow
        -1, -1,  1,     1, 1, 0,    // Index:  4
         1, -1,  1,     1, 1, 0,    // Index:  5
         1,  1,  1,     1, 1, 0,    // Index:  6
        -1,  1,  1,     1, 1, 0,    // Index:  7
        // Face C       // Green
        -1, -1, -1,     0, 1, 0,    // Index:  8
        -1,  1, -1,     0, 1, 0,    // Index:  9
        -1,  1,  1,     0, 1, 0,    // Index: 10
        -1, -1,  1,     0, 1, 0,    // Index: 11
        // Face D       // Blue
         1, -1, -1,     0, 0, 1,    // Index: 12
         1,  1, -1,     0, 0, 1,    // Index: 13
         1,  1,  1,     0, 0, 1,    // Index: 14
         1, -1,  1,     0, 0, 1,    // Index: 15
        // Face E       // Orange
        -1, -1, -1,     1, 0.5, 0,  // Index: 16
        -1, -1,  1,     1, 0.5, 0,  // Index: 17
         1, -1,  1,     1, 0.5, 0,  // Index: 18
         1, -1, -1,     1, 0.5, 0,  // Index: 19
        // Face F       // White
        -1,  1, -1,     1, 1, 1,    // Index: 20
        -1,  1,  1,     1, 1, 1,    // Index: 21
         1,  1,  1,     1, 1, 1,    // Index: 22
         1,  1, -1,     1, 1, 1     // Index: 23
    ];

    var indices = [
        0, 1, 2,     0, 2, 3,     // Face A
        4, 5, 6,     4, 6, 7,     // Face B
        8, 9, 10,    8, 10, 11,   // Face C
        12, 13, 14,  12, 14, 15,  // Face D
        16, 17, 18,  16, 18, 19,  // Face E
        20, 21, 22,  20, 22, 23   // Face F     
    ];

    // Create a linked-list for storing the vertices data in the GPU realm
    var buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    var indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

    // VERTEX SHADER
    var vertexShaderCode = `
        attribute vec3 aPosition;
        attribute vec3 aColor;
        uniform float uTheta;
        uniform float uDX;
        uniform float uDY;
        uniform mat4 uView;
        uniform mat4 uProjection;
        varying vec3 vColor;
        void main () {
            //gl_PointSize = 15.0;
            vec3 position = vec3(aPosition);
            position.z = -sin(uTheta) * aPosition.z + cos(uTheta) * aPosition.y;
            position.y = sin(uTheta) * aPosition.y + cos(uTheta) * aPosition.z;
            gl_Position = uProjection * uView * vec4(position.x + uDX, position.y + uDY, position.z, 1.0);
            // gl_Position is the final destination for storing
            //  positional data for the rendered vertex
            vColor = aColor;
        }
    `;
    var vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, vertexShaderCode);
    gl.compileShader(vertexShader);

    // FRAGMENT SHADER
    var fragmentShaderCode = `
        precision mediump float;
        varying vec3 vColor;
        void main() {
            gl_FragColor = vec4(vColor, 1.0);
            // Blue = R:0, G:0, B:1, A:1
            // gl_FragColor is the final destination for storing
            //  color data for the rendered fragment
        }
    `;
    var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, fragmentShaderCode);
    gl.compileShader(fragmentShader);

    // Comparing to C-Programming, we may imagine
    //  that up to this step we have created two
    //  object files (.o), for the vertex and fragment shaders

    var shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);
    gl.useProgram(shaderProgram);

    // Local variables
    var isAnimated = false;
    var theta = 0.0;
    var direction = "";
    var dX = 0.0;
    var dY = 0.0;
    // For the camera
    var cameraX = 0.0;
    var cameraZ = 5.0;  // 5 unit from the origin outwards the screen
    var uView = gl.getUniformLocation(shaderProgram, "uView");
    var view = glMatrix.mat4.create();  // Create an identity matrix
    glMatrix.mat4.lookAt(
        view,
        [cameraX, 0.0, cameraZ],
        [cameraX, 0.0, -10.0],
        [0.0, 1.0, 0.0]
    );
    // For the projection
    var uProjection = gl.getUniformLocation(shaderProgram, "uProjection");
    var perspective = glMatrix.mat4.create();
    glMatrix.mat4.perspective(
        perspective,
        Math.PI/3,  // 60 degrees
        1.0,
        0.5, 
        10.0
    );
    gl.uniformMatrix4fv(uView, false, view);
    gl.uniformMatrix4fv(uProjection, false, perspective);

    // Local functions
    function onMouseClick (event) {
        isAnimated = !isAnimated;
    }
    function onKeyDown (event) {
        if (event.keyCode == 32) {  // Space button
            isAnimated = true;
        }
        switch (event.keyCode) {
            case 38: // UP
                direction = "up";
                break;
            case 40: // DOWN
                direction = "down";
                break;
            case 39: // RIGHT
                direction = "right";
                break;
            case 37: // LEFT
                direction = "left";
                break;
            default:
                break;
        }
    }
    function onKeyUp (event) {
        if (event.keyCode == 32) {  // Space button
            isAnimated = false;
        }
        //console.log("keyup");
        direction = "";
    }
    document.addEventListener("click", onMouseClick);
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("keyup", onKeyUp);

    // All the qualifiers needed by shaders
    var uTheta = gl.getUniformLocation(shaderProgram, "uTheta");
    var uDX = gl.getUniformLocation(shaderProgram, "uDX");
    var uDY = gl.getUniformLocation(shaderProgram, "uDY");

    // Teach the GPU how to collect
    //  the positional values from ARRAY_BUFFER
    //  for each vertex being processed
    var aPosition = gl.getAttribLocation(shaderProgram, "aPosition");
    gl.vertexAttribPointer(
        aPosition, 
        3, 
        gl.FLOAT, 
        false, 
        6 * Float32Array.BYTES_PER_ELEMENT, 
        0);
    gl.enableVertexAttribArray(aPosition);
    var aColor = gl.getAttribLocation(shaderProgram, "aColor");
    gl.vertexAttribPointer(
        aColor, 
        3, 
        gl.FLOAT, 
        false, 
        6 * Float32Array.BYTES_PER_ELEMENT, 
        3 * Float32Array.BYTES_PER_ELEMENT);
    gl.enableVertexAttribArray(aColor);
    
    function render() {
        gl.enable(gl.DEPTH_TEST);
        gl.clearColor(1.0, 0.75,   0.79,  1.0);
                //Red, Green, Blue, Alpha
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        if (isAnimated) {
            theta += 0.01;
            gl.uniform1f(uTheta, theta);
        }
        switch (direction) {
            case "up":
                dY += 0.1;
                gl.uniform1f(uDY, dY);
                break;
            case "down":
                dY -= 0.1;
                gl.uniform1f(uDY, dY);
                break;
            case "left":
                dX -= 0.1;
                gl.uniform1f(uDX, dX);
                break;
            case "right":
                dX += 0.1;
                gl.uniform1f(uDX, dX);
                break;
        
            default:
                break;
        }
        gl.drawElements(gl.TRIANGLES, indices.length, 
            gl.UNSIGNED_SHORT, 0);
        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
}