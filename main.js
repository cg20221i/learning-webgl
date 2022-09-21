function main() {
    var canvas = document.getElementById("myCanvas");
    var gl = canvas.getContext("webgl");

    /**
     * A (  0.5,  0.0)  Red     (1.0, 0.0, 0.0)
     * B (  0.0, -0.5)  Green   (0.0, 1.0, 0.0)
     * C ( -0.5,  0.0)  Blue    (0.0, 0.0, 1.0)
     * D (  0.0,  0.5)  Black   (0.0, 0.0, 0.0)
     */

    var vertices = [
        0.5, 0.0, 1.0, 0.0, 0.0,
        0.0, -0.5, 0.0, 1.0, 0.0,
        -0.5, 0.0, 0.0, 0.0, 1.0,
        0.0, 0.5, 0.0, 0.0, 0.0
    ];

    // Create a linked-list for storing the vertices data in the GPU realm
    var buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

    // VERTEX SHADER
    var vertexShaderCode = `
        attribute vec2 aPosition;
        attribute vec3 aColor;
        uniform float uTheta;
        uniform float uDX;
        uniform float uDY;
        varying vec3 vColor;
        void main () {
            //gl_PointSize = 15.0;
            vec2 position = vec2(aPosition);
            position.x = -sin(uTheta) * aPosition.x + cos(uTheta) * aPosition.y;
            position.y = sin(uTheta) * aPosition.y + cos(uTheta) * aPosition.x;
            gl_Position = vec4(position.x + uDX, position.y + uDY, 0.0, 1.0);
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
        2, 
        gl.FLOAT, 
        false, 
        5 * Float32Array.BYTES_PER_ELEMENT, 
        0);
    gl.enableVertexAttribArray(aPosition);
    var aColor = gl.getAttribLocation(shaderProgram, "aColor");
    gl.vertexAttribPointer(
        aColor, 
        3, 
        gl.FLOAT, 
        false, 
        5 * Float32Array.BYTES_PER_ELEMENT, 
        2 * Float32Array.BYTES_PER_ELEMENT);
    gl.enableVertexAttribArray(aColor);
    
    function render() {
        gl.clearColor(1.0, 0.75,   0.79,  1.0);
                //Red, Green, Blue, Alpha
        gl.clear(gl.COLOR_BUFFER_BIT);
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
        gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
}