import React, { useEffect, useMemo, useRef } from "react";

export type AgentState = "idle" | "thinking" | "listening" | "talking";

type OrbProps = {
  colors?: [string] | [string, string] | [string, string, string];
  seed?: number;
  agentState?: AgentState;
  inputVolume?: number;
  outputVolume?: number;
  getInputVolume?: () => number;
  getOutputVolume?: () => number;
  className?: string;
};

function hexToRgb(hex: string): [number, number, number] {
  hex = hex.replace(/^#/, "");
  if (hex.length === 3) {
    hex = hex
      .split("")
      .map((c) => c + c)
      .join("");
  }
  const num = parseInt(hex, 16);
  return [(num >> 16) / 255, ((num >> 8) & 255) / 255, (num & 255) / 255];
}

function lerpColor(
  c1: [number, number, number],
  c2: [number, number, number],
  t: number,
): [number, number, number] {
  return [
    c1[0] + (c2[0] - c1[0]) * t,
    c1[1] + (c2[1] - c1[1]) * t,
    c1[2] + (c2[2] - c1[2]) * t,
  ];
}

function normalizeColors(
  c: [string] | [string, string] | [string, string, string],
): [string, string, string] {
  if (c.length === 1) return [c[0], c[0], "#FFFFFF"];
  if (c.length === 2) return [c[0], c[0], c[1]];
  return c;
}

export function Orb({
  colors: rawColors = ["#CADCFC", "#A0B9D1", "#FFFFFF"],
  seed,
  agentState = "idle",
  inputVolume,
  outputVolume,
  getInputVolume,
  getOutputVolume,
  className,
}: OrbProps) {
  const colors = normalizeColors(rawColors);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const agentRef = useRef<AgentState>(agentState);
  const inputVolumeRef = useRef<number>(inputVolume ?? 0);
  const outputVolumeRef = useRef<number>(outputVolume ?? 0);
  const colorsStateRef = useRef<[string, string, string]>(colors);
  const isManualRef = useRef<boolean>(
    inputVolume !== undefined ||
      outputVolume !== undefined ||
      getInputVolume !== undefined ||
      getOutputVolume !== undefined,
  );

  useEffect(() => {
    agentRef.current = agentState;
  }, [agentState]);

  useEffect(() => {
    isManualRef.current =
      inputVolume !== undefined ||
      outputVolume !== undefined ||
      getInputVolume !== undefined ||
      getOutputVolume !== undefined;
    inputVolumeRef.current = clamp01(
      inputVolume ?? getInputVolume?.() ?? 0,
    );
    outputVolumeRef.current = clamp01(
      outputVolume ?? getOutputVolume?.() ?? 0,
    );
  }, [inputVolume, outputVolume, getInputVolume, getOutputVolume]);

  useEffect(() => {
    colorsStateRef.current = colors;
  }, [colors]);

  const random = useMemo(
    () => splitmix32(seed ?? Math.floor(Math.random() * 2 ** 32)),
    [seed],
  );
  const offsets = useMemo(
    () =>
      new Float32Array(Array.from({ length: 7 }, () => random() * Math.PI * 2)),
    [random],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl", {
      alpha: true,
      antialias: true,
      premultipliedAlpha: true,
    });
    if (!gl) return;

    // Setup WebGL
    const program = gl.createProgram()!;
    const vShader = gl.createShader(gl.VERTEX_SHADER)!;
    gl.shaderSource(vShader, vertexShaderSource);
    gl.compileShader(vShader);
    if (!gl.getShaderParameter(vShader, gl.COMPILE_STATUS)) {
      console.error(gl.getShaderInfoLog(vShader));
    }

    const fShader = gl.createShader(gl.FRAGMENT_SHADER)!;
    gl.shaderSource(fShader, fragmentShaderSource);
    gl.compileShader(fShader);
    if (!gl.getShaderParameter(fShader, gl.COMPILE_STATUS)) {
      console.error(gl.getShaderInfoLog(fShader));
    }

    gl.attachShader(program, vShader);
    gl.attachShader(program, fShader);
    gl.linkProgram(program);
    gl.useProgram(program);

    // Geometry (Full screen quad)
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW,
    );

    const positionLoc = gl.getAttribLocation(program, "position");
    gl.enableVertexAttribArray(positionLoc);
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

    // Uniforms
    const uniforms = {
      uTime: gl.getUniformLocation(program, "uTime"),
      uAnimation: gl.getUniformLocation(program, "uAnimation"),
      uOffsets: gl.getUniformLocation(program, "uOffsets"),
      uColor1: gl.getUniformLocation(program, "uColor1"),
      uColor2: gl.getUniformLocation(program, "uColor2"),
      uColor3: gl.getUniformLocation(program, "uColor3"),
      uInputVolume: gl.getUniformLocation(program, "uInputVolume"),
      uOutputVolume: gl.getUniformLocation(program, "uOutputVolume"),
      uOpacity: gl.getUniformLocation(program, "uOpacity"),
      uResolution: gl.getUniformLocation(program, "uResolution"),
    };

    gl.uniform1fv(uniforms.uOffsets, offsets);

    let animationFrameId: number;
    let lastTime = performance.now();

    // State values for animation
    let uTime = 0;
    let uAnimation = 0.1;
    let uOpacity = 0;
    let curIn = 0;
    let curOut = 0;
    let animSpeed = 0.1;
    let currentColor1 = hexToRgb(colorsStateRef.current[0]);
    let currentColor2 = hexToRgb(colorsStateRef.current[1]);
    let currentColor3 = hexToRgb(colorsStateRef.current[2]);

    const render = (time: number) => {
      const delta = (time - lastTime) / 1000; // in seconds
      lastTime = time;

      // Handle Resize
      const displayWidth = canvas.clientWidth;
      const displayHeight = canvas.clientHeight;
      const pixelRatio = window.devicePixelRatio || 1;

      const width = Math.floor(displayWidth * pixelRatio);
      const height = Math.floor(displayHeight * pixelRatio);

      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        gl.viewport(0, 0, width, height);
      }

      // Update state
      const liveColors = colorsStateRef.current;
      const targetColor1 = hexToRgb(liveColors[0]);
      const targetColor2 = hexToRgb(liveColors[1]);
      const targetColor3 = hexToRgb(liveColors[2]);

      currentColor1 = lerpColor(currentColor1, targetColor1, 0.08);
      currentColor2 = lerpColor(currentColor2, targetColor2, 0.08);
      currentColor3 = lerpColor(currentColor3, targetColor3, 0.08);

      uTime += delta * 0.5;
      if (uOpacity < 1) {
        uOpacity = Math.min(1, uOpacity + delta * 2);
      }

      let targetIn = 0;
      let targetOut = 0.3;
      if (isManualRef.current) {
        targetIn = clamp01(
          inputVolume ?? getInputVolume?.() ?? 0,
        );
        targetOut = clamp01(
          outputVolume ?? getOutputVolume?.() ?? 0,
        );
      } else {
        const t = uTime * 2;
        if (agentRef.current === "listening") {
          targetIn = clamp01(0.55 + Math.sin(t * 3.2) * 0.35);
          targetOut = 0.45;
        } else if (agentRef.current === "talking") {
          targetIn = clamp01(0.65 + Math.sin(t * 4.8) * 0.22);
          targetOut = clamp01(0.75 + Math.sin(t * 3.6) * 0.22);
        } else {
          const base = 0.38 + 0.07 * Math.sin(t * 0.7);
          const wander = 0.05 * Math.sin(t * 2.1) * Math.sin(t * 0.37 + 1.2);
          targetIn = clamp01(base + wander);
          targetOut = clamp01(0.48 + 0.12 * Math.sin(t * 1.05 + 0.6));
        }
      }

      curIn += (targetIn - curIn) * 0.2;
      curOut += (targetOut - curOut) * 0.2;

      const targetSpeed = 0.1 + (1 - Math.pow(curOut - 1, 2)) * 0.9;
      animSpeed += (targetSpeed - animSpeed) * 0.12;
      uAnimation += delta * animSpeed;

      // Update uniforms
      gl.uniform1f(uniforms.uTime, uTime);
      gl.uniform1f(uniforms.uAnimation, uAnimation);
      gl.uniform3f(
        uniforms.uColor1,
        currentColor1[0],
        currentColor1[1],
        currentColor1[2],
      );
      gl.uniform3f(
        uniforms.uColor2,
        currentColor2[0],
        currentColor2[1],
        currentColor2[2],
      );
      gl.uniform3f(
        uniforms.uColor3,
        currentColor3[0],
        currentColor3[1],
        currentColor3[2],
      );
      gl.uniform1f(uniforms.uInputVolume, curIn);
      gl.uniform1f(uniforms.uOutputVolume, curOut);
      gl.uniform1f(uniforms.uOpacity, uOpacity);
      gl.uniform2f(uniforms.uResolution, canvas.width, canvas.height);

      // Draw
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 6);

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      gl.deleteProgram(program);
      gl.deleteShader(vShader);
      gl.deleteShader(fShader);
      gl.deleteBuffer(positionBuffer);

      const loseContext = gl.getExtension("WEBGL_lose_context");
      if (loseContext) {
        loseContext.loseContext();
      }
    };
  }, [offsets]);

  return (
    <div className={className ?? "relative h-full w-full"}>
      <canvas
        ref={canvasRef}
        style={{
          width: "100%",
          height: "100%",
          display: "block",
        }}
      />
    </div>
  );
}

function splitmix32(a: number) {
  return function () {
    a |= 0;
    a = (a + 0x9e3779b9) | 0;
    let t = a ^ (a >>> 16);
    t = Math.imul(t, 0x21f0aaad);
    t = t ^ (t >>> 15);
    t = Math.imul(t, 0x735a2d97);
    return ((t = t ^ (t >>> 15)) >>> 0) / 4294967296;
  };
}

function clamp01(n: number) {
  if (!Number.isFinite(n)) return 0;
  return Math.min(1, Math.max(0, n));
}

const vertexShaderSource = /* glsl */ `
attribute vec2 position;
varying vec2 vUv;

void main() {
  vUv = position * 0.5 + 0.5;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const fragmentShaderSource = /* glsl */ `
precision highp float;

uniform float uTime;
uniform float uAnimation;
uniform float uOffsets[7];
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform vec3 uColor3;
uniform float uInputVolume;
uniform float uOutputVolume;
uniform float uOpacity;
uniform vec2 uResolution;
varying vec2 vUv;

const float PI = 3.14159265358979323846;

// Draw a single oval with soft edges and calculate its gradient color
bool drawOval(vec2 polarUv, vec2 polarCenter, float a, float b, bool reverseGradient, float softness, out vec4 color) {
    vec2 p = polarUv - polarCenter;
    float oval = (p.x * p.x) / (a * a) + (p.y * p.y) / (b * b);

    float edge = smoothstep(1.0, 1.0 - softness, oval);

    if (edge > 0.0) {
        float gradient = reverseGradient ? (1.0 - (p.x / a + 1.0) / 2.0) : ((p.x / a + 1.0) / 2.0);
        // Flatten gradient toward middle value for more uniform appearance
        gradient = mix(0.5, gradient, 0.1);
        color = vec4(vec3(gradient), 0.85 * edge);
        return true;
    }
    return false;
}

// Map grayscale value to a 4-color ramp (color1, color2, color3, color4)
vec3 colorRamp(float grayscale, vec3 color1, vec3 color2, vec3 color3, vec3 color4) {
    if (grayscale < 0.33) {
        return mix(color1, color2, grayscale * 3.0);
    } else if (grayscale < 0.66) {
        return mix(color2, color3, (grayscale - 0.33) * 3.0);
    } else {
        return mix(color3, color4, (grayscale - 0.66) * 3.0);
    }
}

vec2 hash2(vec2 p) {
    return fract(sin(vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)))) * 43758.5453);
}

// 2D noise for the ring
float noise2D(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);

    vec2 u = f * f * (3.0 - 2.0 * f);
    float n = mix(
        mix(dot(hash2(i + vec2(0.0, 0.0)), f - vec2(0.0, 0.0)),
            dot(hash2(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0)), u.x),
        mix(dot(hash2(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0)),
            dot(hash2(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0)), u.x),
        u.y
    );

    return 0.5 + 0.5 * n;
}

float sharpRing(vec3 decomposed, float time) {
    float ringStart = 1.0;
    float ringWidth = 0.3;
    float noiseScale = 5.0;

    float noise = mix(
        noise2D(vec2(decomposed.x, time) * noiseScale),
        noise2D(vec2(decomposed.y, time) * noiseScale),
        decomposed.z
    );

    noise = (noise - 0.5) * 2.5;

    return ringStart + noise * ringWidth * 1.5;
}

float smoothRing(vec3 decomposed, float time) {
    float ringStart = 0.9;
    float ringWidth = 0.2;
    float noiseScale = 6.0;

    float noise = mix(
        noise2D(vec2(decomposed.x, time) * noiseScale),
        noise2D(vec2(decomposed.y, time) * noiseScale),
        decomposed.z
    );

    noise = (noise - 0.5) * 5.0;

    return ringStart + noise * ringWidth;
}

float flow(vec3 decomposed, float time) {
    return mix(
        noise2D(vec2(time, decomposed.x * 2.0)),
        noise2D(vec2(time, decomposed.y * 2.0)),
        decomposed.z
    );
}

void main() {
    // Normalize uv based on aspect ratio to keep it circular
    vec2 uv = gl_FragCoord.xy / uResolution.xy;
    uv = uv * 2.0 - 1.0;

    float aspect = uResolution.x / uResolution.y;
    if (aspect > 1.0) {
        uv.x *= aspect;
    } else {
        uv.y /= aspect;
    }

    // Convert uv to polar coordinates
    float radius = length(uv);

    // We only draw the circle.
    if (radius > 1.0) {
      gl_FragColor = vec4(0.0);
      return;
    }

    float theta = atan(uv.y, uv.x);
    if (theta < 0.0) theta += 2.0 * PI; // Normalize theta to [0, 2*PI]

    // Decomposed angle is used for sampling noise textures without seams:
    // float noise = mix(sample(decomposed.x), sample(decomposed.y), decomposed.z);
    vec3 decomposed = vec3(
        // angle in the range [0, 1]
        theta / (2.0 * PI),
        // angle offset by 180 degrees in the range [1, 2]
        mod(theta / (2.0 * PI) + 0.5, 1.0) + 1.0,
        // mixing factor between two noises
        abs(theta / PI - 1.0)
    );

    // Add noise to the angle for a flow-like distortion (reduced for flatter look)
    float noise = flow(decomposed, radius * 0.03 - uAnimation * 0.2) - 0.5;
    theta += noise * mix(0.08, 0.25, uOutputVolume);

    // Initialize the base color to white
    vec4 color = vec4(1.0, 1.0, 1.0, 1.0);

    // Original parameters for the ovals in polar coordinates
    float originalCenters[7];
    originalCenters[0] = 0.0;
    originalCenters[1] = 0.5 * PI;
    originalCenters[2] = 1.0 * PI;
    originalCenters[3] = 1.5 * PI;
    originalCenters[4] = 2.0 * PI;
    originalCenters[5] = 2.5 * PI;
    originalCenters[6] = 3.0 * PI;

    // Parameters for the animated centers in polar coordinates
    float centers[7];
    for (int i = 0; i < 7; i++) {
        centers[i] = originalCenters[i] + 0.5 * sin(uTime / 20.0 + uOffsets[i]);
    }

    float a, b;
    vec4 ovalColor;

    // Check if the pixel is inside any of the ovals
    for (int i = 0; i < 7; i++) {
        float noiseVal = noise2D(vec2(mod(centers[i] + uTime * 0.05, 1.0) * 5.0, 0.5));
        a = 0.5 + noiseVal * 0.3; // Increased for more coverage
        b = noiseVal * mix(3.5, 2.5, uInputVolume); // Increased height for fuller appearance

        bool reverseGradient = false;
        if (i == 1 || i == 3 || i == 5) {
            reverseGradient = true;
        }

        // Calculate the distance in polar coordinates
        float distTheta = min(
            abs(theta - centers[i]),
            min(
                abs(theta + 2.0 * PI - centers[i]),
                abs(theta - 2.0 * PI - centers[i])
            )
        );
        float distRadius = radius;

        float softness = 0.6; // Increased softness for flatter, less pronounced edges

        // Check if the pixel is inside the oval in polar coordinates
        if (drawOval(vec2(distTheta, distRadius), vec2(0.0, 0.0), a, b, reverseGradient, softness, ovalColor)) {
            // Blend the oval color with the existing color
            color.rgb = mix(color.rgb, ovalColor.rgb, ovalColor.a);
            color.a = max(color.a, ovalColor.a); // Max alpha
        }
    }

    // Calculate both noisy rings
    float ringRadius1 = sharpRing(decomposed, uTime * 0.1);
    float ringRadius2 = smoothRing(decomposed, uTime * 0.1);

    // Adjust rings based on input volume (reduced for flatter appearance)
    float inputRadius1 = radius + uInputVolume * 0.2;
    float inputRadius2 = radius + uInputVolume * 0.15;
    float opacity1 = mix(0.2, 0.6, uInputVolume);
    float opacity2 = mix(0.15, 0.45, uInputVolume);

    // Blend both rings
    float ringAlpha1 = (inputRadius2 >= ringRadius1) ? opacity1 : 0.0;
    float ringAlpha2 = smoothstep(ringRadius2 - 0.05, ringRadius2 + 0.05, inputRadius1) * opacity2;

    float totalRingAlpha = max(ringAlpha1, ringAlpha2);

    // Apply screen blend mode for combined rings
    vec3 ringColor = vec3(1.0); // White ring color
    color.rgb = 1.0 - (1.0 - color.rgb) * (1.0 - ringColor * totalRingAlpha);

    // Convert grayscale color to the 4-stop color ramp
    float luminance = color.r;
    color.rgb = colorRamp(luminance, vec3(1.0), uColor1, uColor2, uColor3);

    // Apply fade-in opacity and circle alpha
    float circleAlpha = smoothstep(1.0, 0.99, radius);
    color.a *= uOpacity * circleAlpha;

    gl_FragColor = color;
}
`;
