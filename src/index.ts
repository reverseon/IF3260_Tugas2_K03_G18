import "./css/index.css";
import { getWebGLContext, reRender} from "./lib/util";
import { ZeroHollow} from "./model";
import {Point} from "./lib/baseClass";

function init() {
    let canvas = document.getElementById("canvas") as HTMLCanvasElement;
    let gl = getWebGLContext(canvas);
    reRender(gl!, [
        new ZeroHollow(gl!,
            new Point(100, 10, 0, 1),
            200, 300, 100, 20
        )
    ])

}
init();