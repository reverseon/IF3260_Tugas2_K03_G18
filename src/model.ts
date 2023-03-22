import { version } from "eslint-scope";
import {Point, Shape, Vertex, Color} from "./lib/baseClass";
import {createProgramFromShaderSources, m4util} from "./lib/util";
class ZeroHollow extends Shape {
    vertices: Vertex[] = [];
    center: Point = new Point(0, 0, 0, 1);

    constructor(gl: WebGLRenderingContext) {
        const vertexShaderSource = `
            attribute vec4 a_position;
            attribute vec4 a_color;
            varying vec4 v_color;
            uniform mat4 u_matrix;
            void main() {
                v_color = a_color;
                gl_Position = u_matrix * a_position;
            }
        `
        const fragmentShaderSource = `
            precision mediump float;
            varying vec4 v_color;
            void main() {
                gl_FragColor = v_color;
            }
        `
        super([],
            createProgramFromShaderSources(
                gl,
                vertexShaderSource,
                fragmentShaderSource
            )!
        );
    }
    async loadfile() {
        const response = await fetch(require("./base/zerohollow.json"));
        const json = await response.json();
        this.vertices = json.vertices.map((v: any) => {
            return new Vertex(
                new Point(v.position.x, v.position.y, v.position.z, v.position.w),
                new Color(v.color.r, v.color.g, v.color.b, v.color.a)
            )
        })
        this.center = new Point(json.center.x, json.center.y, json.center.z, 1);
    }
    private verticesToF32ArrayPoint(vertices: Vertex[]): Float32Array {
        const f32Array = new Float32Array(vertices.length * 4);
        for (let i = 0; i < vertices.length; i++) {
            const vertex = vertices[i];
            f32Array[i * 4] = vertex.position.x;
            f32Array[i * 4 + 1] = vertex.position.y;
            f32Array[i * 4 + 2] = vertex.position.z;
            f32Array[i * 4 + 3] = vertex.position.w;
        }
        return f32Array;
    }
    private verticesToF32ArrayColor(vertices: Vertex[]): Float32Array {
        const f32Array = new Float32Array(vertices.length * 4);
        for (let i = 0; i < vertices.length; i++) {
            const vertex = vertices[i];
            f32Array[i * 4] = vertex.color.r;
            f32Array[i * 4 + 1] = vertex.color.g;
            f32Array[i * 4 + 2] = vertex.color.b;
            f32Array[i * 4 + 3] = vertex.color.a;
        }
        return f32Array;
    }
    draw(gl: WebGLRenderingContext): void {
        gl.useProgram(this.program);
        let positionAttributeLocation = gl.getAttribLocation(this.program, "a_position");
        let colorAttributeLocation = gl.getAttribLocation(this.program, "a_color");
        let uMatrixLocation = gl.getUniformLocation(this.program, "u_matrix");
        let positionBuffer = gl.createBuffer();
        let colorBuffer = gl.createBuffer();
        let vertices = this.vertices;
        let positionArray = this.verticesToF32ArrayPoint(vertices);
        let colorArray = this.verticesToF32ArrayColor(vertices);
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, positionArray, gl.STATIC_DRAW);
        gl.enableVertexAttribArray(positionAttributeLocation);
        gl.vertexAttribPointer(positionAttributeLocation, 4, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, colorArray, gl.STATIC_DRAW);
        gl.enableVertexAttribArray(colorAttributeLocation);
        gl.vertexAttribPointer(colorAttributeLocation, 4, gl.FLOAT, false, 0, 0);
        let matrix = m4util.projection((gl.canvas as HTMLCanvasElement).clientWidth, (gl.canvas as HTMLCanvasElement).clientHeight);
        let toOrigin = m4util.translation(
            -this.center.x,
            -this.center.y,
            -this.center.z
        );
        let rotxmat = m4util.xRotation(this.rotxrad);
        let rotymat = m4util.yRotation(this.rotyrad);
        let rotzmat = m4util.zRotation(this.rotzrad);
        let translatemat = m4util.translation(
            this.translatex,
            this.translatey,
            this.translatez
        );
        let scalemat = m4util.scaling(
            this.scalex,
            this.scaley,
            this.scalez
        );
        let toCenter = m4util.translation(
            this.center.x,
            this.center.y,
            this.center.z
        );
        matrix = m4util.multiply(matrix, toCenter);
        matrix = m4util.multiply(matrix, rotxmat);
        matrix = m4util.multiply(matrix, rotymat);
        matrix = m4util.multiply(matrix, rotzmat);
        matrix = m4util.multiply(matrix, scalemat);
        matrix = m4util.multiply(matrix, translatemat);
        matrix = m4util.multiply(matrix, toOrigin);
        gl.uniformMatrix4fv(uMatrixLocation, false, matrix);
        gl.drawArrays(gl.TRIANGLES, 0, vertices.length);
    }
}

class TriangularPrism extends Shape {
    vertices: Vertex[] = [];
    center: Point = new Point(150, 150, 195, 1);

    constructor(gl: WebGLRenderingContext) {
        const vertexShaderSource = `
            attribute vec4 a_position;
            attribute vec4 a_color;
            varying vec4 v_color;
            uniform mat4 u_matrix;
            void main() {
                v_color = a_color;
                gl_Position = u_matrix * a_position;
            }
        `
        const fragmentShaderSource = `
            precision mediump float;
            varying vec4 v_color;
            void main() {
                gl_FragColor = v_color;
            }
        `
        super([],
            createProgramFromShaderSources(
                gl,
                vertexShaderSource,
                fragmentShaderSource
            )!
        );
    }
    async loadfile() {
        const response = await fetch(require("./base/triangularprism.json"));
        const json = await response.json();
        this.vertices = json.vertices.map((v: any) => {
            return new Vertex(
                new Point(v.position.x, v.position.y, v.position.z, v.position.w),
                new Color(v.color.r, v.color.g, v.color.b, v.color.a)
            )
        })
        this.center = new Point(json.center.x, json.center.y, json.center.z, 1);
    }
    private verticesToF32ArrayPoint(vertices: Vertex[]): Float32Array {
        const f32Array = new Float32Array(vertices.length * 4);
        for (let i = 0; i < vertices.length; i++) {
            const vertex = vertices[i];
            f32Array[i * 4] = vertex.position.x;
            f32Array[i * 4 + 1] = vertex.position.y;
            f32Array[i * 4 + 2] = vertex.position.z;
            f32Array[i * 4 + 3] = vertex.position.w;
        }
        return f32Array;
    }
    private verticesToF32ArrayColor(vertices: Vertex[]): Float32Array {
        const f32Array = new Float32Array(vertices.length * 4);
        for (let i = 0; i < vertices.length; i++) {
            const vertex = vertices[i];
            f32Array[i * 4] = vertex.color.r;
            f32Array[i * 4 + 1] = vertex.color.g;
            f32Array[i * 4 + 2] = vertex.color.b;
            f32Array[i * 4 + 3] = vertex.color.a;
        }
        return f32Array;
    }
    draw(gl: WebGLRenderingContext): void {
        gl.useProgram(this.program);
        let positionAttributeLocation = gl.getAttribLocation(this.program, "a_position");
        let colorAttributeLocation = gl.getAttribLocation(this.program, "a_color");
        let uMatrixLocation = gl.getUniformLocation(this.program, "u_matrix");
        let positionBuffer = gl.createBuffer();
        let colorBuffer = gl.createBuffer();
        let vertices = this.vertices;
        let positionArray = this.verticesToF32ArrayPoint(vertices);
        let colorArray = this.verticesToF32ArrayColor(vertices);
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, positionArray, gl.STATIC_DRAW);
        gl.enableVertexAttribArray(positionAttributeLocation);
        gl.vertexAttribPointer(positionAttributeLocation, 4, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, colorArray, gl.STATIC_DRAW);
        gl.enableVertexAttribArray(colorAttributeLocation);
        gl.vertexAttribPointer(colorAttributeLocation, 4, gl.FLOAT, false, 0, 0);
        let matrix = m4util.projection((gl.canvas as HTMLCanvasElement).clientWidth, (gl.canvas as HTMLCanvasElement).clientHeight);
        let toOrigin = m4util.translation(
            -this.center.x,
            -this.center.y,
            -this.center.z
        );
        let rotxmat = m4util.xRotation(this.rotxrad);
        let rotymat = m4util.yRotation(this.rotyrad);
        let rotzmat = m4util.zRotation(this.rotzrad);
        let translatemat = m4util.translation(
            this.translatex,
            this.translatey,
            this.translatez
        );
        let scalemat = m4util.scaling(
            this.scalex,
            this.scaley,
            this.scalez
        );
        let toCenter = m4util.translation(
            this.center.x,
            this.center.y,
            this.center.z
        );
        matrix = m4util.multiply(matrix, toCenter);
        matrix = m4util.multiply(matrix, rotxmat);
        matrix = m4util.multiply(matrix, rotymat);
        matrix = m4util.multiply(matrix, rotzmat);
        matrix = m4util.multiply(matrix, scalemat);
        matrix = m4util.multiply(matrix, translatemat);
        matrix = m4util.multiply(matrix, toOrigin);
        gl.uniformMatrix4fv(uMatrixLocation, false, matrix);
        gl.drawArrays(gl.TRIANGLES, 0, vertices.length);
    }
}

class Tetrahedron extends Shape{
    side : number;
    thickness : number;
    center: Point;
    pointIndex : Point[] = new Array(16);
    vertices : Vertex[] = [];
    constructor(gl: WebGLRenderingContext, center: Point, side : number, thickness : number){
        const vertexShaderSource = `
            attribute vec4 a_position;
            attribute vec4 a_color;
            varying vec4 v_color;
            uniform mat4 u_matrix;
            void main() {
                v_color = a_color;
                gl_Position = u_matrix * a_position;
            }
        `
        const fragmentShaderSource = `
            precision mediump float;
            varying vec4 v_color;
            void main() {
                gl_FragColor = v_color;
            }
        `

        super([],
            createProgramFromShaderSources(
                gl,
                vertexShaderSource,
                fragmentShaderSource
            )!
        )
        this.side = side;
        this.thickness = thickness;
        this.center = center;
    }

    async loadfile() {
        const response = await fetch(require("./base/tetrahedron.json"));
        const json = await response.json();
        this.vertices = json.vertices.map((v: any) => {
            return new Vertex(
                new Point(v.position.x, v.position.y, v.position.z, v.position.w),
                new Color(v.color.r, v.color.g, v.color.b, v.color.a)
            )
        })
        this.center = new Point(json.center.x, json.center.y, json.center.z, 1);
    }
    private updatePointIndex(): void {
        const bigCubeCoordinate = Math.sqrt(2)/2*this.side;
        const smallCubeCoordinate = Math.sqrt(2)/2*(this.side - this.thickness);
        // ujung - ujung tetrahedron
        this.pointIndex[0] = new Point(bigCubeCoordinate, bigCubeCoordinate, bigCubeCoordinate,1);
        this.pointIndex[1] = new Point(-bigCubeCoordinate, -bigCubeCoordinate, bigCubeCoordinate,1);
        this.pointIndex[2] = new Point(bigCubeCoordinate, -bigCubeCoordinate, -bigCubeCoordinate,1);
        this.pointIndex[3] = new Point(-bigCubeCoordinate, bigCubeCoordinate, -bigCubeCoordinate,1);

        // titik dekat titik 0
        this.pointIndex[4] = new Point(smallCubeCoordinate, 2*smallCubeCoordinate - bigCubeCoordinate, smallCubeCoordinate,1); // bidang 0,1,2
        this.pointIndex[5] = new Point(2*smallCubeCoordinate - bigCubeCoordinate, smallCubeCoordinate, smallCubeCoordinate,1); // bidang 0,1,3
        this.pointIndex[6] = new Point(smallCubeCoordinate, smallCubeCoordinate, 2*smallCubeCoordinate - bigCubeCoordinate,1); // bidang 0,2,3

        // titik dekat titik 1
        this.pointIndex[7] = new Point(-smallCubeCoordinate, -smallCubeCoordinate, 2*smallCubeCoordinate - bigCubeCoordinate,1); // bidang 1,2,3
        this.pointIndex[8] = new Point(bigCubeCoordinate - 2*smallCubeCoordinate, -smallCubeCoordinate ,smallCubeCoordinate, 1); // bidang 1,2,0
        this.pointIndex[9] = new Point(-smallCubeCoordinate, bigCubeCoordinate - 2*smallCubeCoordinate, smallCubeCoordinate, 1); // bidang 1,0,3

        // titik dekat titik 2
        this.pointIndex[10] = new Point(smallCubeCoordinate, bigCubeCoordinate - 2*smallCubeCoordinate, -smallCubeCoordinate, 1); // bidang 2,3,0
        this.pointIndex[11] = new Point(smallCubeCoordinate, -smallCubeCoordinate, bigCubeCoordinate - 2*smallCubeCoordinate, 1); // bidang 2,0,1
        this.pointIndex[12] = new Point(2*smallCubeCoordinate - bigCubeCoordinate, -smallCubeCoordinate, -smallCubeCoordinate, 1); // bidang 1,2,3

        // titik dekat titik 3
        this.pointIndex[13] = new Point(-smallCubeCoordinate, smallCubeCoordinate, bigCubeCoordinate - 2*smallCubeCoordinate, 1); // bidang 3,0,1
        this.pointIndex[14] = new Point(-smallCubeCoordinate, 2*smallCubeCoordinate - bigCubeCoordinate, -smallCubeCoordinate, 1); // bidang 3,1,2
        this.pointIndex[15] = new Point(bigCubeCoordinate - 2*smallCubeCoordinate, smallCubeCoordinate, -smallCubeCoordinate, 1); // bidang 3,2,0

        this.translatePointIndex(250,200,0);
    }

    private createRenderedVertices() : Vertex[] {
        this.updatePointIndex();
        const outColor : Color = new Color(0,0,1,1);
        const outColor1 : Color = new Color(0,0,0.9,1);
        const inColor : Color = new Color(0,0,0.5,1);
        const outVertices012 : Vertex[] = [
            new Vertex(this.pointIndex[0], outColor),
            new Vertex(this.pointIndex[2], outColor),
            new Vertex(this.pointIndex[4], outColor),
            new Vertex(this.pointIndex[4], outColor),
            new Vertex(this.pointIndex[2], outColor),
            new Vertex(this.pointIndex[11], outColor),
            new Vertex(this.pointIndex[2], outColor),
            new Vertex(this.pointIndex[1], outColor),
            new Vertex(this.pointIndex[11], outColor),
            new Vertex(this.pointIndex[11], outColor),
            new Vertex(this.pointIndex[1], outColor),
            new Vertex(this.pointIndex[8], outColor),
            new Vertex(this.pointIndex[1], outColor),
            new Vertex(this.pointIndex[0], outColor),
            new Vertex(this.pointIndex[8], outColor),
            new Vertex(this.pointIndex[8], outColor),
            new Vertex(this.pointIndex[0], outColor),
            new Vertex(this.pointIndex[4], outColor),
        ];
        const outVertices123 : Vertex[] = [
            new Vertex(this.pointIndex[7], outColor),
            new Vertex(this.pointIndex[1], outColor),
            new Vertex(this.pointIndex[12], outColor),
            new Vertex(this.pointIndex[12], outColor),
            new Vertex(this.pointIndex[1], outColor),
            new Vertex(this.pointIndex[2], outColor),
            new Vertex(this.pointIndex[12], outColor),
            new Vertex(this.pointIndex[2], outColor),
            new Vertex(this.pointIndex[14], outColor),
            new Vertex(this.pointIndex[14], outColor),
            new Vertex(this.pointIndex[2], outColor),
            new Vertex(this.pointIndex[3], outColor),
            new Vertex(this.pointIndex[14], outColor),
            new Vertex(this.pointIndex[3], outColor),
            new Vertex(this.pointIndex[7], outColor),
            new Vertex(this.pointIndex[7], outColor),
            new Vertex(this.pointIndex[3], outColor),
            new Vertex(this.pointIndex[1], outColor)
        ];
        const outVertices230 : Vertex[] = [
            new Vertex(this.pointIndex[2], outColor),
            new Vertex(this.pointIndex[0], outColor),
            new Vertex(this.pointIndex[10], outColor),
            new Vertex(this.pointIndex[10], outColor),
            new Vertex(this.pointIndex[0], outColor),
            new Vertex(this.pointIndex[6], outColor),
            new Vertex(this.pointIndex[0], outColor),
            new Vertex(this.pointIndex[3], outColor),
            new Vertex(this.pointIndex[6], outColor),
            new Vertex(this.pointIndex[6], outColor),
            new Vertex(this.pointIndex[3], outColor),
            new Vertex(this.pointIndex[15], outColor),
            new Vertex(this.pointIndex[3], outColor),
            new Vertex(this.pointIndex[2], outColor),
            new Vertex(this.pointIndex[15], outColor),
            new Vertex(this.pointIndex[15], outColor),
            new Vertex(this.pointIndex[2], outColor),
            new Vertex(this.pointIndex[10], outColor),
        ];
        const outVertices301 : Vertex[] = [
            new Vertex(this.pointIndex[13], outColor),
            new Vertex(this.pointIndex[3], outColor),
            new Vertex(this.pointIndex[5], outColor),
            new Vertex(this.pointIndex[5], outColor),
            new Vertex(this.pointIndex[3], outColor),
            new Vertex(this.pointIndex[0], outColor),
            new Vertex(this.pointIndex[5], outColor),
            new Vertex(this.pointIndex[0], outColor),
            new Vertex(this.pointIndex[9], outColor),
            new Vertex(this.pointIndex[9], outColor),
            new Vertex(this.pointIndex[0], outColor),
            new Vertex(this.pointIndex[1], outColor),
            new Vertex(this.pointIndex[9], outColor),
            new Vertex(this.pointIndex[1], outColor),
            new Vertex(this.pointIndex[13], outColor),
            new Vertex(this.pointIndex[13], outColor),
            new Vertex(this.pointIndex[1], outColor),
            new Vertex(this.pointIndex[3], outColor)
        ]
        const inVertices : Vertex[] = [
            new Vertex(this.pointIndex[6], inColor),
            new Vertex(this.pointIndex[5], inColor),
            new Vertex(this.pointIndex[4], inColor),
            new Vertex(this.pointIndex[7], inColor),
            new Vertex(this.pointIndex[8], inColor),
            new Vertex(this.pointIndex[9], inColor),
            new Vertex(this.pointIndex[10], inColor),
            new Vertex(this.pointIndex[11], inColor),
            new Vertex(this.pointIndex[12], inColor),
            new Vertex(this.pointIndex[15], inColor),
            new Vertex(this.pointIndex[14], inColor),
            new Vertex(this.pointIndex[13], inColor),
            // antara titik 0 dan titik 1
            new Vertex(this.pointIndex[4], inColor),
            new Vertex(this.pointIndex[5], inColor),
            new Vertex(this.pointIndex[9], inColor),
            new Vertex(this.pointIndex[4], inColor),
            new Vertex(this.pointIndex[9], inColor),
            new Vertex(this.pointIndex[8], inColor),
            // antara titik 1 dan titik 3
            new Vertex(this.pointIndex[7], inColor),
            new Vertex(this.pointIndex[9], inColor),
            new Vertex(this.pointIndex[13], inColor),
            new Vertex(this.pointIndex[7], inColor),
            new Vertex(this.pointIndex[13], inColor),
            new Vertex(this.pointIndex[14], inColor),
            // antara titik 0 dan titik 3
            new Vertex(this.pointIndex[5], inColor),
            new Vertex(this.pointIndex[6], inColor),
            new Vertex(this.pointIndex[13], inColor),
            new Vertex(this.pointIndex[13], inColor),
            new Vertex(this.pointIndex[6], inColor),
            new Vertex(this.pointIndex[15], inColor),

            // antara titik 2 dan titik 1
            new Vertex(this.pointIndex[8], inColor),
            new Vertex(this.pointIndex[7], inColor),
            new Vertex(this.pointIndex[11], inColor),
            new Vertex(this.pointIndex[11], inColor),
            new Vertex(this.pointIndex[7], inColor),
            new Vertex(this.pointIndex[12], inColor),

            // antara titik 2 dan tiitk 0
            new Vertex(this.pointIndex[6], inColor),
            new Vertex(this.pointIndex[4], inColor),
            new Vertex(this.pointIndex[10], inColor),
            new Vertex(this.pointIndex[4], inColor),
            new Vertex(this.pointIndex[11], inColor),
            new Vertex(this.pointIndex[10], inColor),

            // antara titik 2 dan titik 3
            new Vertex(this.pointIndex[10], inColor),
            new Vertex(this.pointIndex[12], inColor),
            new Vertex(this.pointIndex[14], inColor),
            new Vertex(this.pointIndex[10], inColor),
            new Vertex(this.pointIndex[14], inColor),
            new Vertex(this.pointIndex[15], inColor),
        ];

        return [
            ...outVertices012,
            ...outVertices123,
            ...outVertices230,
            ...outVertices301,
            ...inVertices
        ];
    }

    private verticesToF32ArrayPoint(vertices: Vertex[]): Float32Array {
        const f32Array = new Float32Array(vertices.length * 4);
        for (let i = 0; i < vertices.length; i++) {
            const vertex = vertices[i];
            f32Array[i * 4] = vertex.position.x;
            f32Array[i * 4 + 1] = vertex.position.y;
            f32Array[i * 4 + 2] = vertex.position.z;
            f32Array[i * 4 + 3] = vertex.position.w;
        }
        return f32Array;
    }
    private verticesToF32ArrayColor(vertices: Vertex[]): Float32Array {
        const f32Array = new Float32Array(vertices.length * 4);
        for (let i = 0; i < vertices.length; i++) {
            const vertex = vertices[i];
            f32Array[i * 4] = vertex.color.r;
            f32Array[i * 4 + 1] = vertex.color.g;
            f32Array[i * 4 + 2] = vertex.color.b;
            f32Array[i * 4 + 3] = vertex.color.a;
        }
        return f32Array;
    }

    private translatePointIndex(x : number, y : number, z : number) : void {
        for(let i=0; i<this.pointIndex.length; i++){
            this.pointIndex[i].x += x;
            this.pointIndex[i].y += y;
            this.pointIndex[i].z += z;
        }
    }

    draw(gl: WebGLRenderingContext): void {
        gl.useProgram(this.program);
        let positionAttributeLocation = gl.getAttribLocation(this.program, "a_position");
        let colorAttributeLocation = gl.getAttribLocation(this.program, "a_color");
        let uMatrixLocation = gl.getUniformLocation(this.program, "u_matrix");
        let positionBuffer = gl.createBuffer();
        let colorBuffer = gl.createBuffer();
        let vertices = this.vertices;
        let positionArray = this.verticesToF32ArrayPoint(vertices);
        console.log(positionArray)
        let colorArray = this.verticesToF32ArrayColor(vertices);
        // gl.enable(gl.CULL_FACE);
        //gl.enable(gl.DEPTH_TEST);
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, positionArray, gl.STATIC_DRAW);
        gl.enableVertexAttribArray(positionAttributeLocation);
        gl.vertexAttribPointer(positionAttributeLocation, 4, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, colorArray, gl.STATIC_DRAW);
        gl.enableVertexAttribArray(colorAttributeLocation);
        gl.vertexAttribPointer(colorAttributeLocation, 4, gl.FLOAT, false, 0, 0);
        let matrix = m4util.projection((gl.canvas as HTMLCanvasElement).clientWidth, (gl.canvas as HTMLCanvasElement).clientHeight);
        gl.uniformMatrix4fv(uMatrixLocation, false, matrix);
        gl.drawArrays(gl.TRIANGLES, 0, vertices.length);
    }
}

export {
    ZeroHollow,
    Tetrahedron, TriangularPrism
}