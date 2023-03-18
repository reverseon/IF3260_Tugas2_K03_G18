import {Point, Shape, Vertex, Color} from "./lib/baseClass";
import {createProgramFromShaderSources, m4util} from "./lib/util";

class ZeroHollow extends Shape {
    startingPoint: Point;
    dx: number;
    dy: number;
    dz: number;
    thick: number;
    color: number[] = [0.0, 0.0, 0.0, 1.0];
    pointIndex: Point[] = new Array(16);
    constructor(gl: WebGLRenderingContext, sp: Point, dx: number, dy: number, dz: number, thick: number) {
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
        this.startingPoint = sp;
        this.dx = dx;
        this.dy = dy;
        this.dz = dz;
        this.thick = thick;
    }
    private updatePointIndex(): void {
        const sx = this.startingPoint.x;
        const sy = this.startingPoint.y;
        const sz = this.startingPoint.z;
        const dx = this.dx;
        const dy = this.dy;
        const dz = this.dz;
        const t = this.thick;
        this.pointIndex[0] = new Point(sx, sy, sz, 1);
        this.pointIndex[1] = new Point(sx + dx, sy, sz, 1);
        this.pointIndex[2] = new Point(sx + dx, sy + dy, sz, 1);
        this.pointIndex[3] = new Point(sx, sy + dy, sz, 1);
        this.pointIndex[4] = new Point(sx + t, sy + t, sz, 1);
        this.pointIndex[5] = new Point(sx + dx - t, sy + t, sz, 1);
        this.pointIndex[6] = new Point(sx + dx - t, sy + dy - t, sz, 1);
        this.pointIndex[7] = new Point(sx + t, sy + dy - t, sz, 1);
        this.pointIndex[8] = new Point(sx, sy, sz + dz, 1);
        this.pointIndex[9] = new Point(sx + dx, sy, sz + dz, 1);
        this.pointIndex[10] = new Point(sx + dx, sy + dy, sz + dz, 1);
        this.pointIndex[11] = new Point(sx, sy + dy, sz + dz, 1);
        this.pointIndex[12] = new Point(sx + t, sy + t, sz + dz, 1);
        this.pointIndex[13] = new Point(sx + dx - t, sy + t, sz + dz, 1);
        this.pointIndex[14] = new Point(sx + dx - t, sy + dy - t, sz + dz, 1);
        this.pointIndex[15] = new Point(sx + t, sy + dy - t, sz + dz, 1);
    }
    private createRenderedVertices(): Vertex[] {
        this.updatePointIndex();
        const leftFrontColor = new Color(0, 1, 0, 1);
        const leftFront: Vertex[] = [
            new Vertex(this.pointIndex[0], leftFrontColor),
            new Vertex(this.pointIndex[4], leftFrontColor),
            new Vertex(this.pointIndex[7], leftFrontColor),
            new Vertex(this.pointIndex[0], leftFrontColor),
            new Vertex(this.pointIndex[7], leftFrontColor),
            new Vertex(this.pointIndex[3], leftFrontColor),
        ]
        const rightFrontColor = new Color(1, 1, 0, 1);
        const rightFront: Vertex[] = [
            new Vertex(this.pointIndex[1], rightFrontColor),
            new Vertex(this.pointIndex[2], rightFrontColor),
            new Vertex(this.pointIndex[6], rightFrontColor),
            new Vertex(this.pointIndex[1], rightFrontColor),
            new Vertex(this.pointIndex[6], rightFrontColor),
            new Vertex(this.pointIndex[5], rightFrontColor),
        ]
        const upFrontColor = new Color(0, 1, 1, 1);
        const upFront: Vertex[] = [
            new Vertex(this.pointIndex[2], upFrontColor),
            new Vertex(this.pointIndex[3], upFrontColor),
            new Vertex(this.pointIndex[7], upFrontColor),
            new Vertex(this.pointIndex[2], upFrontColor),
            new Vertex(this.pointIndex[7], upFrontColor),
            new Vertex(this.pointIndex[6], upFrontColor),
        ]
        const downFrontColor = new Color(0, 0, 1, 1);
        const downFront: Vertex[] = [
            new Vertex(this.pointIndex[0], downFrontColor),
            new Vertex(this.pointIndex[1], downFrontColor),
            new Vertex(this.pointIndex[5], downFrontColor),
            new Vertex(this.pointIndex[0], downFrontColor),
            new Vertex(this.pointIndex[5], downFrontColor),
            new Vertex(this.pointIndex[4], downFrontColor),
        ]
        // to do: add middle side and back side
        return [
            ...leftFront,
            ...rightFront,
            ...upFront,
            ...downFront,
        ]
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
        console.log("here")
        let positionAttributeLocation = gl.getAttribLocation(this.program, "a_position");
        let colorAttributeLocation = gl.getAttribLocation(this.program, "a_color");
        let uMatrixLocation = gl.getUniformLocation(this.program, "u_matrix");
        let positionBuffer = gl.createBuffer();
        let colorBuffer = gl.createBuffer();
        let vertices = this.createRenderedVertices();
        let positionArray = this.verticesToF32ArrayPoint(vertices);
        console.log(positionArray)
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
        gl.uniformMatrix4fv(uMatrixLocation, false, matrix);
        gl.drawArrays(gl.TRIANGLES, 0, vertices.length);
    }
}

export {
    ZeroHollow
}