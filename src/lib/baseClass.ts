class Point {
    x: number;
    y: number;
    z: number;
    w: number;
    constructor(x: number, y: number, z: number, w: number) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.w = w;
    }
    getArray(): number[] {
        return [this.x, this.y, this.z, this.w];
    }
}

class Color {
    r: number;
    g: number;
    b: number;
    a: number;
    constructor(r: number, g: number, b: number, a: number) {
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a;
    }
}

class Vertex {
    position: Point;
    color: Color;
    constructor(position: Point, color: Color) {
        this.position = position;
        this.color = color;
    }
}

abstract class Shape {
    program: WebGLProgram;
    constructor(vertices: Vertex[], program: WebGLProgram) {
        this.program = program;
    }
    abstract draw(gl: WebGLRenderingContext): void;
}



export {
    Vertex,
    Shape,
    Point,
    Color
}