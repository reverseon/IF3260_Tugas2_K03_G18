import {CameraMode, Color, Point, Shape, Vertex} from "./lib/baseClass";
import {createProgramFromShaderSources, m4util} from "./lib/util";

class ZeroHollow extends Shape {
    points: Point[] = [];
    indices: number[] = [];
    colors: Color[] = [];
    renderedVertices: Vertex[] = [];
    center: Point = new Point(0, 0, 0, 1);


    constructor(gl: WebGLRenderingContext) {
        const vertexShaderSource = `
            attribute vec4 a_position;
            attribute vec4 a_color;
            attribute vec4 a_normal;
            varying vec4 v_color;
            uniform mat4 u_matrix;
            uniform mat4 u_viewTransposeMatrix;
            varying vec3 v_normal;
            void main() {
                v_color = a_color;
                gl_Position = u_matrix * a_position;
                v_normal = mat3(u_viewTransposeMatrix) * a_normal.xyz;
            }
        `
        const fragmentShaderSource = `
            precision mediump float;
            uniform bool u_shading;
            uniform vec3 u_lightWorldPos;
            varying vec4 v_color;
            varying vec3 v_normal;
            void main() {
                vec3 normal = normalize(v_normal);
                float light = dot(u_lightWorldPos, normal);
                gl_FragColor = v_color;
                if (u_shading) {
                    gl_FragColor.rgb *= light;
                }
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
    private getCenter(vertices: Vertex[]): Point {
        let x = 0;
        let y = 0;
        let z = 0;
        for (let i = 0; i < vertices.length; i++) {
            x += vertices[i].position.x;
            y += vertices[i].position.y;
            z += vertices[i].position.z;
        }
        return new Point(x / vertices.length, y / vertices.length, z / vertices.length, 1);
    }
    private hexToColor(hex: string): Color {
        let r = parseInt(hex.slice(1, 3), 16) / 255;
        let g = parseInt(hex.slice(3, 5), 16) / 255;
        let b = parseInt(hex.slice(5, 7), 16) / 255;
        return new Color(r, g, b, 1);
    }
    loadfile(jsonr: any) {
        let json = jsonr.zeroHollow
        this.points = json.vertices.map(
            (v: any) => {
                return new Point(v.x, v.y, v.z, 1);
            }
        )
        this.indices = json.indices;
        this.colors = json.hexColors.map(
            (hex: string) => this.hexToColor(hex)
        )
        this.renderedVertices = this.createRenderedVertices();
        this.center = this.getCenter(this.renderedVertices);
    }
    private createRenderedVertices(): Vertex[] {
        let renderedVertices = []
        for (let i = 0; i < this.indices.length/6; i++) {
            for (let j = 0; j < 6; j++) {
                let index = this.indices[i*6 + j]
                let point = this.points[index]
                let color = this.colors[i]
                renderedVertices.push(new Vertex(point, color))
            }
        }
        return renderedVertices;
    }
    private verticesToF32PointArray(vertex: Vertex[]): Float32Array {
        let array: number[] = [];
        for (let i = 0; i < vertex.length; i++) {
            array.push(vertex[i].position.x);
            array.push(vertex[i].position.y);
            array.push(vertex[i].position.z);
            array.push(vertex[i].position.w);
        }
        return new Float32Array(array);
    }
    private verticesToF32ColorArray(vertex: Vertex[]): Float32Array {
        let array: number[] = [];
        for (let i = 0; i < vertex.length; i++) {
            array.push(vertex[i].color.r);
            array.push(vertex[i].color.g);
            array.push(vertex[i].color.b);
            array.push(vertex[i].color.a);
        }
        return new Float32Array(array);
    }
    private pointsToF32PointArray(points: Point[]): Float32Array {
        let array: number[] = [];
        for (let i = 0; i < points.length; i++) {
            array.push(points[i].x);
            array.push(points[i].y);
            array.push(points[i].z);
            array.push(points[i].w);
        }
        return new Float32Array(array);
    }
    private createNormal(vertices: Vertex[]): Point[] {
        let pts = vertices.map(v => v.position)
        let normals: Point[] = []
        for (let i = 0; i < pts.length; i+=3) {
            let p1 = pts[i]
            let p2 = pts[i+1]
            let p3 = pts[i+2]
            let v1 = new Point(p2.x - p1.x, p2.y - p1.y, p2.z - p1.z, 1)
            let v2 = new Point(p3.x - p1.x, p3.y - p1.y, p3.z - p1.z, 1)
            let normal = new Point(
                v1.y * v2.z - v1.z * v2.y,
                v1.z * v2.x - v1.x * v2.z,
                v1.x * v2.y - v1.y * v2.x,
                1
            )
            normals.push(normal)
            normals.push(normal)
            normals.push(normal)
        }
        return normals
    }
    private colorToHex(color: Color): string {
        let r = Math.round(color.r * 255).toString(16);
        let g = Math.round(color.g * 255).toString(16);
        let b = Math.round(color.b * 255).toString(16);
        return "#" + r + g + b;
    }
    getTransformedVerticesJSON(): string {
        let pts = this.points
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
        let matrix = m4util.translation(
            this.center.x,
            this.center.y,
            this.center.z
        )
        matrix = m4util.multiply(matrix, translatemat);
        matrix = m4util.multiply(matrix, rotxmat);
        matrix = m4util.multiply(matrix, rotymat);
        matrix = m4util.multiply(matrix, rotzmat);
        matrix = m4util.multiply(matrix, scalemat);
        matrix = m4util.multiply(matrix, toOrigin);
        let transformedPoints: Point[] = []
        for (let pt of pts) {
            let numvert = m4util.matvec(matrix, [pt.x, pt.y, pt.z, pt.w])
            transformedPoints.push(new Point(numvert[0], numvert[1], numvert[2], numvert[3]))
        }
        console.log(
            "zerohollow",
            this.translatex,
            this.translatey,
            this.translatez,
            this.rotxrad,
            this.rotyrad,
            this.rotzrad,
            this.scalex,
            this.scaley,
            this.scalez,
            this.center,
        )
        let finalobj = {
            zeroHollow: {
                vertices: transformedPoints.map(pt => {
                    return {
                        x: pt.x,
                        y: pt.y,
                        z: pt.z
                    }
                }),
                indices: this.indices,
                hexColors: this.colors.map(color => this.colorToHex(color))
            }
        }
        return JSON.stringify(finalobj)
    }
    draw(gl: WebGLRenderingContext): void {
        gl.useProgram(this.program);
        let positionAttributeLocation = gl.getAttribLocation(this.program, "a_position");
        let colorAttributeLocation = gl.getAttribLocation(this.program, "a_color");
        let uMatrixLocation = gl.getUniformLocation(this.program, "u_matrix");
        let positionBuffer = gl.createBuffer();
        let colorBuffer = gl.createBuffer();
        let positionArray = this.verticesToF32PointArray(this.renderedVertices);
        let colorArray = this.verticesToF32ColorArray(this.renderedVertices);
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, positionArray, gl.STATIC_DRAW);
        gl.enableVertexAttribArray(positionAttributeLocation);
        gl.vertexAttribPointer(positionAttributeLocation, 4, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, colorArray, gl.STATIC_DRAW);
        gl.enableVertexAttribArray(colorAttributeLocation);
        gl.vertexAttribPointer(colorAttributeLocation, 4, gl.FLOAT, false, 0, 0);
        let matrix: number[] = []
        let depth = 1000;
        if (this.camMode == CameraMode.Ortho) {
            this.orthoInstance.updateProjectionMatrix((gl.canvas as HTMLCanvasElement).clientWidth, (gl.canvas as HTMLCanvasElement).clientHeight, depth);
            this.orthoInstance.translatex = -(gl.canvas as HTMLCanvasElement).clientWidth / 2;
            this.orthoInstance.translatey = -(gl.canvas as HTMLCanvasElement).clientHeight / 2;
            this.orthoInstance.updateViewMatrix();
            matrix = m4util.multiply(this.orthoInstance.projectionMatrix, this.orthoInstance.viewMatrix);
        } else if (this.camMode == CameraMode.Perspective) {
            this.perspectiveInstance.focus = this.center
            this.perspectiveInstance.updateProjectionMatrix(
                60 * Math.PI / 180,
                (gl.canvas as HTMLCanvasElement).clientWidth / (gl.canvas as HTMLCanvasElement).clientHeight,
                1,
                depth,
            )
            this.perspectiveInstance.translatez = -depth/2;
            this.perspectiveInstance.updateViewMatrix();
            matrix = m4util.multiply(this.perspectiveInstance.projectionMatrix, this.perspectiveInstance.viewMatrix);
        } else if (this.camMode == CameraMode.Oblique) {
            this.obliqueInstance.updateProjectionMatrix(
                45 * Math.PI / 180,
                75 * Math.PI / 180,
                (gl.canvas as HTMLCanvasElement).clientWidth,
                (gl.canvas as HTMLCanvasElement).clientHeight,
                depth,
            )
            this.obliqueInstance.translatex = -(gl.canvas as HTMLCanvasElement).clientWidth / 2;
            this.obliqueInstance.translatey = -(gl.canvas as HTMLCanvasElement).clientHeight / 2;
            this.obliqueInstance.updateViewMatrix();
            matrix = m4util.multiply(this.obliqueInstance.projectionMatrix, this.obliqueInstance.viewMatrix);
        }
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
        matrix = m4util.multiply(matrix, translatemat);
        matrix = m4util.multiply(matrix, rotxmat);
        matrix = m4util.multiply(matrix, rotymat);
        matrix = m4util.multiply(matrix, rotzmat);
        matrix = m4util.multiply(matrix, scalemat);
        matrix = m4util.multiply(matrix, toOrigin);
        let viewtransposeMatrix = toCenter
        viewtransposeMatrix = m4util.multiply(viewtransposeMatrix, translatemat);
        viewtransposeMatrix = m4util.multiply(viewtransposeMatrix, rotxmat);
        viewtransposeMatrix = m4util.multiply(viewtransposeMatrix, rotymat);
        viewtransposeMatrix = m4util.multiply(viewtransposeMatrix, rotzmat);
        viewtransposeMatrix = m4util.multiply(viewtransposeMatrix, scalemat);
        viewtransposeMatrix = m4util.multiply(viewtransposeMatrix, toOrigin);
        viewtransposeMatrix = m4util.transpose(m4util.inverse(viewtransposeMatrix));
        gl.uniformMatrix4fv(uMatrixLocation, false, matrix);
        // lighting
        let lightDirection = m4util.normalize([0, 0, 1]);
        let uLightDirectionLocation = gl.getUniformLocation(this.program, "u_lightWorldPos");
        gl.uniform3fv(uLightDirectionLocation, lightDirection);
        let normals: Point[] = this.createNormal(this.renderedVertices);
        let normalBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.pointsToF32PointArray(normals), gl.STATIC_DRAW);
        let normalAttributeLocation = gl.getAttribLocation(this.program, "a_normal");
        gl.enableVertexAttribArray(normalAttributeLocation);
        gl.vertexAttribPointer(normalAttributeLocation, 4, gl.FLOAT, false, 0, 0);
        let uViewTransposeMatrixLocation = gl.getUniformLocation(this.program, "u_viewTransposeMatrix");
        gl.uniformMatrix4fv(uViewTransposeMatrixLocation, false, viewtransposeMatrix);
        let ushadingLocation = gl.getUniformLocation(this.program, "u_shading");
        gl.uniform1i(ushadingLocation, this.shading ? 1 : 0);
        gl.drawArrays(gl.TRIANGLES, 0, this.renderedVertices.length)
        // let posCopy: Point[] = this.renderedVertices.map((v) => {return v.position})
        // for (let i = 0; i < posCopy.length; i++) {
        //     let ps = posCopy[i];
        //     let p = m4util.matvec(matrix, [
        //             ps.x,
        //             ps.y,
        //             ps.z,
        //             ps.w
        //     ])
        //     console.log(ps, [
        //         p[0] / p[3],
        //         p[1] / p[3],
        //         p[2] / p[3],
        //         p[3]
        //     ])
        // }
        // console.log(matrix)
    }
}
class TriangularPrism extends Shape {
    renderedVertices: Vertex[] = [];
    center: Point = new Point(150, 150, 195, 1);

    constructor(gl: WebGLRenderingContext) {
        const vertexShaderSource = `
            attribute vec4 a_position;
            attribute vec4 a_color;
            attribute vec4 a_normal;
            varying vec4 v_color;
            uniform mat4 u_matrix;
            uniform mat4 u_viewTransposeMatrix;
            varying vec3 v_normal;
            void main() {
                v_color = a_color;
                gl_Position = u_matrix * a_position;
                v_normal = mat3(u_viewTransposeMatrix) * a_normal.xyz;
            }
        `
        const fragmentShaderSource = `
            precision mediump float;
            uniform vec3 u_lightWorldPos;
            uniform bool u_shading;
            varying vec4 v_color;
            varying vec3 v_normal;
            void main() {
                vec3 normal = normalize(v_normal);
                float light = dot(u_lightWorldPos, normal);
                gl_FragColor = v_color;
                if (u_shading) {
                    gl_FragColor.rgb *= light;
                }
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
    loadfile(jsonr: any) {
        let json = jsonr.triangularprism
        this.renderedVertices = json.vertices.map((v: any) => {
            return new Vertex(
                new Point(v.position.x, v.position.y, v.position.z, v.position.w),
                new Color(v.color.r, v.color.g, v.color.b, v.color.a)
            )
        })
        this.center = this.getCenter(this.renderedVertices);
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
    private createNormal(vertices: Vertex[]): Point[] {
        let pts = vertices.map(v => v.position)
        let normals: Point[] = []
        for (let i = 0; i < pts.length; i+=3) {
            let p1 = pts[i]
            let p2 = pts[i+1]
            let p3 = pts[i+2]
            let v1 = new Point(p2.x - p1.x, p2.y - p1.y, p2.z - p1.z, 1)
            let v2 = new Point(p3.x - p1.x, p3.y - p1.y, p3.z - p1.z, 1)
            let normal = new Point(
                v1.y * v2.z - v1.z * v2.y,
                v1.z * v2.x - v1.x * v2.z,
                v1.x * v2.y - v1.y * v2.x,
                1
            )
            normals.push(normal)
            normals.push(normal)
            normals.push(normal)
        }
        return normals
    }
    private pointsToF32PointArray(points: Point[]): Float32Array {
        let array: number[] = [];
        for (let i = 0; i < points.length; i++) {
            array.push(points[i].x);
            array.push(points[i].y);
            array.push(points[i].z);
            array.push(points[i].w);
        }
        return new Float32Array(array);
    }
    private getCenter(vertices: Vertex[]): Point {
        let x = 0;
        let y = 0;
        let z = 0;
        for (let i = 0; i < vertices.length; i++) {
            x += vertices[i].position.x;
            y += vertices[i].position.y;
            z += vertices[i].position.z;
        }
        return new Point(x / vertices.length, y / vertices.length, z / vertices.length, 1);
    }
    getTransformedVerticesJSON(): string {
        let vertices = this.renderedVertices
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
        let matrix = m4util.translation(
            this.center.x,
            this.center.y,
            this.center.z
        )
        matrix = m4util.multiply(matrix, translatemat);
        matrix = m4util.multiply(matrix, rotxmat);
        matrix = m4util.multiply(matrix, rotymat);
        matrix = m4util.multiply(matrix, rotzmat);
        matrix = m4util.multiply(matrix, scalemat);
        matrix = m4util.multiply(matrix, toOrigin);
        console.log(
            "triangular prism",
            this.translatex,
            this.translatey,
            this.translatez,
            this.rotxrad,
            this.rotyrad,
            this.rotzrad,
            this.scalex,
            this.scaley,
            this.scalez,
            this.center,
        )
        let transformedVertices: Vertex[] = []
        for (let vertex of vertices) {
            let numvert = m4util.matvec(matrix, [vertex.position.x, vertex.position.y, vertex.position.z, vertex.position.w])
            transformedVertices.push(new Vertex(new Point(numvert[0], numvert[1], numvert[2], numvert[3]), vertex.color))
        }
        let finalobj = {triangularprism:{
            vertices: transformedVertices,
        }}
        return JSON.stringify(finalobj)
    }
    draw(gl: WebGLRenderingContext): void {
        gl.useProgram(this.program);
        let positionAttributeLocation = gl.getAttribLocation(this.program, "a_position");
        let colorAttributeLocation = gl.getAttribLocation(this.program, "a_color");
        let uMatrixLocation = gl.getUniformLocation(this.program, "u_matrix");
        let positionBuffer = gl.createBuffer();
        let colorBuffer = gl.createBuffer();
        let positionArray = this.verticesToF32ArrayPoint(this.renderedVertices);
        let colorArray = this.verticesToF32ArrayColor(this.renderedVertices);
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, positionArray, gl.STATIC_DRAW);
        gl.enableVertexAttribArray(positionAttributeLocation);
        gl.vertexAttribPointer(positionAttributeLocation, 4, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, colorArray, gl.STATIC_DRAW);
        gl.enableVertexAttribArray(colorAttributeLocation);
        gl.vertexAttribPointer(colorAttributeLocation, 4, gl.FLOAT, false, 0, 0);
        let matrix: number[] = []
        let depth = 1000;
        if (this.camMode == CameraMode.Ortho) {
            this.orthoInstance.updateProjectionMatrix((gl.canvas as HTMLCanvasElement).clientWidth, (gl.canvas as HTMLCanvasElement).clientHeight, depth);
            this.orthoInstance.translatex = -(gl.canvas as HTMLCanvasElement).clientWidth / 2;
            this.orthoInstance.translatey = -(gl.canvas as HTMLCanvasElement).clientHeight / 2;
            this.orthoInstance.updateViewMatrix();
            matrix = m4util.multiply(this.orthoInstance.projectionMatrix, this.orthoInstance.viewMatrix);
        } else if (this.camMode == CameraMode.Perspective) {
            this.perspectiveInstance.focus = this.center
            this.perspectiveInstance.updateProjectionMatrix(
                60 * Math.PI / 180,
                (gl.canvas as HTMLCanvasElement).clientWidth / (gl.canvas as HTMLCanvasElement).clientHeight,
                1,
                depth,
            )
            this.perspectiveInstance.translatez = -depth/2;
            this.perspectiveInstance.updateViewMatrix();
            matrix = m4util.multiply(this.perspectiveInstance.projectionMatrix, this.perspectiveInstance.viewMatrix);
        } else if (this.camMode == CameraMode.Oblique) {
            this.obliqueInstance.updateProjectionMatrix(
                45 * Math.PI / 180,
                75 * Math.PI / 180,
                (gl.canvas as HTMLCanvasElement).clientWidth,
                (gl.canvas as HTMLCanvasElement).clientHeight,
                depth,
            )
            this.obliqueInstance.translatex = -(gl.canvas as HTMLCanvasElement).clientWidth / 2;
            this.obliqueInstance.translatey = -(gl.canvas as HTMLCanvasElement).clientHeight / 2;
            this.obliqueInstance.updateViewMatrix();
            matrix = m4util.multiply(this.obliqueInstance.projectionMatrix, this.obliqueInstance.viewMatrix);
        }
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
        matrix = m4util.multiply(matrix, translatemat);
        matrix = m4util.multiply(matrix, rotxmat);
        matrix = m4util.multiply(matrix, rotymat);
        matrix = m4util.multiply(matrix, rotzmat);
        matrix = m4util.multiply(matrix, scalemat);
        matrix = m4util.multiply(matrix, toOrigin);
        let viewtransposeMatrix = toCenter
        viewtransposeMatrix = m4util.multiply(viewtransposeMatrix, translatemat);
        viewtransposeMatrix = m4util.multiply(viewtransposeMatrix, rotxmat);
        viewtransposeMatrix = m4util.multiply(viewtransposeMatrix, rotymat);
        viewtransposeMatrix = m4util.multiply(viewtransposeMatrix, rotzmat);
        viewtransposeMatrix = m4util.multiply(viewtransposeMatrix, scalemat);
        viewtransposeMatrix = m4util.multiply(viewtransposeMatrix, toOrigin);
        viewtransposeMatrix = m4util.transpose(m4util.inverse(viewtransposeMatrix));
        gl.uniformMatrix4fv(uMatrixLocation, false, matrix);
        // lighting
        let lightDirection = m4util.normalize([0, 0, 1]);
        let uLightDirectionLocation = gl.getUniformLocation(this.program, "u_lightWorldPos");
        gl.uniform3fv(uLightDirectionLocation, lightDirection);
        let normals: Point[] = this.createNormal(this.renderedVertices);
        let normalBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.pointsToF32PointArray(normals), gl.STATIC_DRAW);
        let normalAttributeLocation = gl.getAttribLocation(this.program, "a_normal");
        gl.enableVertexAttribArray(normalAttributeLocation);
        gl.vertexAttribPointer(normalAttributeLocation, 4, gl.FLOAT, false, 0, 0);
        let uViewTransposeMatrixLocation = gl.getUniformLocation(this.program, "u_viewTransposeMatrix");
        gl.uniformMatrix4fv(uViewTransposeMatrixLocation, false, viewtransposeMatrix);
        let uShadingLocation = gl.getUniformLocation(this.program, "u_shading");
        gl.uniform1i(uShadingLocation, this.shading ? 1 : 0);
        gl.drawArrays(gl.TRIANGLES, 0, this.renderedVertices.length)
    }
}

class Tetrahedron extends Shape{
    center: Point = new Point(0,0,0,1);
    renderedVertices : Vertex[] = [];
    constructor(gl: WebGLRenderingContext){
        const vertexShaderSource = `
            attribute vec4 a_position;
            attribute vec4 a_color;
            attribute vec4 a_normal;
            varying vec4 v_color;
            uniform mat4 u_matrix;
            uniform mat4 u_viewTransposeMatrix;
            varying vec3 v_normal;
            void main() {
                v_color = a_color;
                gl_Position = u_matrix * a_position;
                v_normal = mat3(u_viewTransposeMatrix) * a_normal.xyz;
            }
        `
        const fragmentShaderSource = `
            precision mediump float;
            uniform bool u_shading;
            uniform vec3 u_lightWorldPos;
            varying vec4 v_color;
            varying vec3 v_normal;
            void main() {
                vec3 normal = normalize(v_normal);
                float light = dot(u_lightWorldPos, normal);
                gl_FragColor = v_color;
                if (u_shading) {
                    gl_FragColor.rgb *= light;
                }
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

    private getCenter(vertices: Vertex[]): Point {
        let x = 0;
        let y = 0;
        let z = 0;
        for (let i = 0; i < vertices.length; i++) {
            x += vertices[i].position.x;
            y += vertices[i].position.y;
            z += vertices[i].position.z;
        }
        return new Point(x / vertices.length, y / vertices.length, z / vertices.length, 1);
    }

    loadfile(jsonr: any) {
        let json = jsonr.tetrahedron;
        this.renderedVertices = json.vertices.map((v: any) => {
            return new Vertex(
                new Point(v.position.x, v.position.y, v.position.z, v.position.w),
                new Color(v.color.r, v.color.g, v.color.b, v.color.a)
            )
        });
        this.center = this.getCenter(this.renderedVertices);
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

    private createNormal(vertices: Vertex[]): Point[] {
        let pts = vertices.map(v => v.position)
        let normals: Point[] = []
        for (let i = 0; i < pts.length; i+=3) {
            let p1 = pts[i]
            let p2 = pts[i+1]
            let p3 = pts[i+2]
            let v1 = new Point(p2.x - p1.x, p2.y - p1.y, p2.z - p1.z, 1)
            let v2 = new Point(p3.x - p1.x, p3.y - p1.y, p3.z - p1.z, 1)
            let normal = new Point(
                v1.y * v2.z - v1.z * v2.y,
                v1.z * v2.x - v1.x * v2.z,
                v1.x * v2.y - v1.y * v2.x,
                1
            )
            normals.push(normal)
            normals.push(normal)
            normals.push(normal)
        }
        return normals
    }
    private pointsToF32PointArray(points: Point[]): Float32Array {
        let array: number[] = [];
        for (let i = 0; i < points.length; i++) {
            array.push(points[i].x);
            array.push(points[i].y);
            array.push(points[i].z);
            array.push(points[i].w);
        }
        return new Float32Array(array);
    }
    draw(gl: WebGLRenderingContext): void {
        gl.useProgram(this.program);
        let positionAttributeLocation = gl.getAttribLocation(this.program, "a_position");
        let colorAttributeLocation = gl.getAttribLocation(this.program, "a_color");
        let uMatrixLocation = gl.getUniformLocation(this.program, "u_matrix");
        let positionBuffer = gl.createBuffer();
        let colorBuffer = gl.createBuffer();
        // this.createRenderedVertices();
        let positionArray = this.verticesToF32ArrayPoint(this.renderedVertices);
        let colorArray = this.verticesToF32ArrayColor(this.renderedVertices);
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, positionArray, gl.STATIC_DRAW);
        gl.enableVertexAttribArray(positionAttributeLocation);
        gl.vertexAttribPointer(positionAttributeLocation, 4, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, colorArray, gl.STATIC_DRAW);
        gl.enableVertexAttribArray(colorAttributeLocation);
        gl.vertexAttribPointer(colorAttributeLocation, 4, gl.FLOAT, false, 0, 0);
        let matrix: number[] = []
        let depth = 1000;
        if (this.camMode == CameraMode.Ortho) {
            this.orthoInstance.updateProjectionMatrix((gl.canvas as HTMLCanvasElement).clientWidth, (gl.canvas as HTMLCanvasElement).clientHeight, depth);
            this.orthoInstance.translatex = -(gl.canvas as HTMLCanvasElement).clientWidth / 2;
            this.orthoInstance.translatey = -(gl.canvas as HTMLCanvasElement).clientHeight / 2;
            this.orthoInstance.updateViewMatrix();
            matrix = m4util.multiply(this.orthoInstance.projectionMatrix, this.orthoInstance.viewMatrix);
        } else if (this.camMode == CameraMode.Perspective) {
            this.perspectiveInstance.focus = this.center
            this.perspectiveInstance.updateProjectionMatrix(
                60 * Math.PI / 180,
                (gl.canvas as HTMLCanvasElement).clientWidth / (gl.canvas as HTMLCanvasElement).clientHeight,
                1,
                depth,
            )
            this.perspectiveInstance.translatez = -depth/2;
            this.perspectiveInstance.updateViewMatrix();
            matrix = m4util.multiply(this.perspectiveInstance.projectionMatrix, this.perspectiveInstance.viewMatrix);
        } else if (this.camMode == CameraMode.Oblique) {
            this.obliqueInstance.updateProjectionMatrix(
                45 * Math.PI / 180,
                75 * Math.PI / 180,
                (gl.canvas as HTMLCanvasElement).clientWidth,
                (gl.canvas as HTMLCanvasElement).clientHeight,
                depth,
            )
            this.obliqueInstance.translatex = -(gl.canvas as HTMLCanvasElement).clientWidth / 2;
            this.obliqueInstance.translatey = -(gl.canvas as HTMLCanvasElement).clientHeight / 2;
            this.obliqueInstance.updateViewMatrix();
            matrix = m4util.multiply(this.obliqueInstance.projectionMatrix, this.obliqueInstance.viewMatrix);
        }
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
        matrix = m4util.multiply(matrix, translatemat);
        matrix = m4util.multiply(matrix, rotxmat);
        matrix = m4util.multiply(matrix, rotymat);
        matrix = m4util.multiply(matrix, rotzmat);
        matrix = m4util.multiply(matrix, scalemat);
        matrix = m4util.multiply(matrix, toOrigin);
        let viewtransposeMatrix = toCenter
        viewtransposeMatrix = m4util.multiply(viewtransposeMatrix, translatemat);
        viewtransposeMatrix = m4util.multiply(viewtransposeMatrix, rotxmat);
        viewtransposeMatrix = m4util.multiply(viewtransposeMatrix, rotymat);
        viewtransposeMatrix = m4util.multiply(viewtransposeMatrix, rotzmat);
        viewtransposeMatrix = m4util.multiply(viewtransposeMatrix, scalemat);
        viewtransposeMatrix = m4util.multiply(viewtransposeMatrix, toOrigin);
        viewtransposeMatrix = m4util.transpose(m4util.inverse(viewtransposeMatrix));
        gl.uniformMatrix4fv(uMatrixLocation, false, matrix);
        // lighting
        let lightDirection = m4util.normalize([0, 0, 1]);
        let uLightDirectionLocation = gl.getUniformLocation(this.program, "u_lightWorldPos");
        gl.uniform3fv(uLightDirectionLocation, lightDirection);
        let normals: Point[] = this.createNormal(this.renderedVertices);
        let normalBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.pointsToF32PointArray(normals), gl.STATIC_DRAW);
        let normalAttributeLocation = gl.getAttribLocation(this.program, "a_normal");
        gl.enableVertexAttribArray(normalAttributeLocation);
        gl.vertexAttribPointer(normalAttributeLocation, 4, gl.FLOAT, false, 0, 0);
        let uViewTransposeMatrixLocation = gl.getUniformLocation(this.program, "u_viewTransposeMatrix");
        gl.uniformMatrix4fv(uViewTransposeMatrixLocation, false, viewtransposeMatrix);
        let uShadingLocation = gl.getUniformLocation(this.program, "u_shading");
        gl.uniform1i(uShadingLocation, this.shading ? 1 : 0);
        gl.drawArrays(gl.TRIANGLES, 0, this.renderedVertices.length)
    }
    getTransformedVerticesJSON(): string {
        let vertices = this.renderedVertices
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
        let matrix = m4util.translation(
            this.center.x,
            this.center.y,
            this.center.z
        )
        matrix = m4util.multiply(matrix, translatemat);
        matrix = m4util.multiply(matrix, rotxmat);
        matrix = m4util.multiply(matrix, rotymat);
        matrix = m4util.multiply(matrix, rotzmat);
        matrix = m4util.multiply(matrix, scalemat);
        matrix = m4util.multiply(matrix, toOrigin);
        console.log(
            "tetra",
            this.translatex,
            this.translatey,
            this.translatez,
            this.rotxrad,
            this.rotyrad,
            this.rotzrad,
            this.scalex,
            this.scaley,
            this.scalez,
            this.center,
        )
        let transformedVertices: Vertex[] = []
        for (let vertex of vertices) {
            let numvert = m4util.matvec(matrix, [vertex.position.x, vertex.position.y, vertex.position.z, vertex.position.w])
            transformedVertices.push(new Vertex(new Point(numvert[0], numvert[1], numvert[2], numvert[3]), vertex.color))
        }
        let finalobj = {
            tetrahedron: {
                vertices: transformedVertices,
            }
        }
        return JSON.stringify(finalobj)
    }
}

export {
    ZeroHollow,
    Tetrahedron, TriangularPrism
}