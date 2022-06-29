const shader_02 = {
  vertex: /*glsl*/ `
    uniform float uTime;
    in float aValues;

    out float vValues;
    out vec3 vNormalInterpolation;
    out vec3 vViewPosition;
    out vec2 vUv;
    out float vTime;

    //	Classic Perlin 2D Noise 
    //	by Stefan Gustavson
    //
    vec4 permute(vec4 x) {
      return mod(((x*34.0)+1.0)*x, 289.0);
    }
    vec2 fade(vec2 t) {return t*t*t*(t*(t*6.0-15.0)+10.0);}
    float cnoise(vec2 P) {
    vec4 Pi = floor(P.xyxy) + vec4(0.0, 0.0, 1.0, 1.0);
    vec4 Pf = fract(P.xyxy) - vec4(0.0, 0.0, 1.0, 1.0);
    Pi = mod(Pi, 289.0); // To avoid truncation effects in permutation
    vec4 ix = Pi.xzxz;
    vec4 iy = Pi.yyww;
    vec4 fx = Pf.xzxz;
    vec4 fy = Pf.yyww;
    vec4 i = permute(permute(ix) + iy);
    vec4 gx = 2.0 * fract(i * 0.0243902439) - 1.0; // 1/41 = 0.024...
    vec4 gy = abs(gx) - 0.5;
    vec4 tx = floor(gx + 0.5);
    gx = gx - tx;
    vec2 g00 = vec2(gx.x,gy.x);
    vec2 g10 = vec2(gx.y,gy.y);
    vec2 g01 = vec2(gx.z,gy.z);
    vec2 g11 = vec2(gx.w,gy.w);
    vec4 norm = 1.79284291400159 - 0.85373472095314 * 
      vec4(dot(g00, g00), dot(g01, g01), dot(g10, g10), dot(g11, g11));
    g00 *= norm.x;
    g01 *= norm.y;
    g10 *= norm.z;
    g11 *= norm.w;
    float n00 = dot(g00, vec2(fx.x, fy.x));
    float n10 = dot(g10, vec2(fx.y, fy.y));
    float n01 = dot(g01, vec2(fx.z, fy.z));
    float n11 = dot(g11, vec2(fx.w, fy.w));
    vec2 fade_xy = fade(Pf.xy);
    vec2 n_x = mix(vec2(n00, n01), vec2(n10, n11), fade_xy.x);
    float n_xy = mix(n_x.x, n_x.y, fade_xy.y);
    return 2.3 * n_xy;
  }

    void main()
    {
      vec4 modelPosition = modelMatrix * vec4(position, 1.0);
      modelPosition.y += sin(aValues * 2.0) * 0.2;
      float height = max(cnoise(uv * 5.0), 0.0);
      height *= 40.0;
      modelPosition.y += height;
      vec4 viewPosition = viewMatrix * modelPosition;
      vec4 projectedPosition = projectionMatrix * viewPosition;
      gl_Position = projectedPosition;
      vValues = aValues;
      vNormalInterpolation = normalMatrix * normal;
      vViewPosition = vec3(viewPosition) / viewPosition.w;
      vUv = uv;
      vTime = uTime;
    }
  `,
  fragment: /*glsl*/ `
    #define PI 3.141592653589793238
    uniform vec3 uLightPosition;

    in float vValues;
    in vec3 vViewPosition;
    in vec3 vNormalInterpolation;
    in vec2 vUv;
    in float vTime;
    out vec4 outColor;

    const vec3 ambientColor = vec3(0.0);
    const vec3 diffuseColor = vec3(0.4,0.6,0.8);
    const vec3 specularColor 	= vec3(0.1, 0.1, 0.1);

    float random(vec2 st) {
        return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
    }

    vec2 rotate(vec2 uv, float rotation, vec2 mid) {
      return vec2(
        cos(rotation) * (uv.x - mid.x) + sin(rotation) * (uv.y - mid.y) + mid.x,
        cos(rotation) * (uv.y - mid.y) - sin(rotation) * (uv.x - mid.x) + mid.y
      );
    }

    //	Classic Perlin 2D Noise 
    //	by Stefan Gustavson
    //
    vec4 permute(vec4 x) {
        return mod(((x*34.0)+1.0)*x, 289.0);
    }
    vec2 fade(vec2 t) {return t*t*t*(t*(t*6.0-15.0)+10.0);}
    float cnoise(vec2 P) {
      vec4 Pi = floor(P.xyxy) + vec4(0.0, 0.0, 1.0, 1.0);
      vec4 Pf = fract(P.xyxy) - vec4(0.0, 0.0, 1.0, 1.0);
      Pi = mod(Pi, 289.0); // To avoid truncation effects in permutation
      vec4 ix = Pi.xzxz;
      vec4 iy = Pi.yyww;
      vec4 fx = Pf.xzxz;
      vec4 fy = Pf.yyww;
      vec4 i = permute(permute(ix) + iy);
      vec4 gx = 2.0 * fract(i * 0.0243902439) - 1.0; // 1/41 = 0.024...
      vec4 gy = abs(gx) - 0.5;
      vec4 tx = floor(gx + 0.5);
      gx = gx - tx;
      vec2 g00 = vec2(gx.x,gy.x);
      vec2 g10 = vec2(gx.y,gy.y);
      vec2 g01 = vec2(gx.z,gy.z);
      vec2 g11 = vec2(gx.w,gy.w);
      vec4 norm = 1.79284291400159 - 0.85373472095314 * 
        vec4(dot(g00, g00), dot(g01, g01), dot(g10, g10), dot(g11, g11));
      g00 *= norm.x;
      g01 *= norm.y;
      g10 *= norm.z;
      g11 *= norm.w;
      float n00 = dot(g00, vec2(fx.x, fy.x));
      float n10 = dot(g10, vec2(fx.y, fy.y));
      float n01 = dot(g01, vec2(fx.z, fy.z));
      float n11 = dot(g11, vec2(fx.w, fy.w));
      vec2 fade_xy = fade(Pf.xy);
      vec2 n_x = mix(vec2(n00, n01), vec2(n10, n11), fade_xy.x);
      float n_xy = mix(n_x.x, n_x.y, fade_xy.y);
      return 2.3 * n_xy;
    }

    void main()
    {
      vec3 xTangent = dFdx( vViewPosition );
      vec3 yTangent = dFdy( vViewPosition );
      vec3 normal = mix(normalize(vNormalInterpolation), normalize(cross(xTangent, yTangent)), 0.5);
      vec3 lightDirection = normalize(uLightPosition - vViewPosition);
      float lambertian = max(dot(lightDirection, normal), 0.0);
      float specular = 0.0;
      if(lambertian > 0.0) {
        vec3 viewDirection = normalize(-vViewPosition);
        vec3 halfDirection = normalize(lightDirection + viewDirection);
        float specularAngle = max(dot(halfDirection, normal), 0.0);
        specular = pow(specularAngle, 16.0);
      }
      // float shading = clamp(dot(lightDirection, normal), 0.8, 1.0);
      outColor = vec4(ambientColor + lambertian * diffuseColor + specular * specularColor, 0.7);
      // pattern 3
      // float strength = vUv.x;
      // pattern 4
      // float strength = vUv.y;
      // pattern 5
      // float strength = 1.0 - vUv.y;
      // pattern 6
      // float strength = vUv.y * 10.0;
      // pattern 7
      // float strength = mod(vUv.y * 10.0, 1.0);
      // pattern 9
      // float strength = step(0.5, mod(vUv.y * 10.0, 1.0));
      // pattern 10
      // float strength = step(0.8, mod(vUv.x * 10.0, 1.0));
      // pattern 11
      // float strength = step(0.8, mod(vUv.x * 10.0, 1.0));
      // strength += step(0.8, mod(vUv.y * 10.0, 1.0));
      // pattern 12
      // float strength = step(0.8, mod(vUv.x * 10.0, 1.0));
      // strength *= step(0.8, mod(vUv.y * 10.0, 1.0));
      // pattern 13
      // float strength = step(0.4, mod(vUv.x * 10.0, 1.0));
      // strength *= step(0.8, mod(vUv.y * 10.0, 1.0));
      // pattern 14
      // float strength1 = step(0.4, mod(vUv.x * 10.0, 1.0));
      // strength1 *= step(0.8, mod(vUv.y * 10.0, 1.0));
      // float strength2 = step(0.8, mod(vUv.x * 10.0, 1.0));
      // strength2 *= step(0.4, mod(vUv.y * 10.0, 1.0));
      // float strength = strength1 + strength2;
      // pattern 15
      // float strength1 = step(0.4, mod(vUv.x * 10.0 - 0.2, 1.0));
      // strength1 *= step(0.8, mod(vUv.y * 10.0 + 0.0, 1.0));
      // float strength2 = step(0.8, mod(vUv.x * 10.0, 1.0));
      // strength2 *= step(0.4, mod(vUv.y * 10.0 - 0.2, 1.0));
      // float strength = strength1 + strength2;
      // pattern 16
      // float strength = abs(vUv.x - 0.5);
      // pattern 17
      // float strength = min(abs(vUv.x - 0.5), abs(vUv.y - 0.5));
      // pattern 18
      // float strength = max(abs(vUv.x - 0.5), abs(vUv.y - 0.5));
      // pattern 19
      // float strength = step(0.2, abs(vUv.x - 0.5)) + step(0.2, abs(vUv.y - 0.5));
      // pattern 20
      // float strength1 = 1.0 - (step(0.25, abs(vUv.x - 0.5)) + step(0.25, abs(vUv.y - 0.5)));
      // float strength2 = step(0.2, abs(vUv.x - 0.5)) + step(0.2, abs(vUv.y - 0.5));
      // float strength = strength1 * strength2;
      // pattern 21
      // float strength = floor(vUv.x * 10.0) / 10.0;
      // pattern 22
      // float strength1 = floor(vUv.x * 10.0) / 10.0;
      // float strength2 = floor(vUv.y * 10.0) / 10.0;
      // float strength = strength1 * strength2;
      // pattern 23
      // float strength = random(vUv);
      // pattern 24
      // vec2 gridUV = vec2(
      //   floor(vUv.x * 10.0) / 10.0,
      //   floor(vUv.y * 10.0) / 10.0
      // );
      // float strength = random(gridUV);
      // pattern 25
      // vec2 gridUV = vec2(
      //   floor(vUv.x * 10.0) / 10.0,
      //   floor(vUv.y * 10.0 + vUv.x * 2.0) / 10.0
      // );
      // float strength = random(gridUV);
      // pattern 26
      // float strength = length(vUv) / 1.4;
      // pattern 27
      // float strength = distance(vUv, vec2(0.5));
      // pattern 28
      // float strength = 1.0 - distance(vUv, vec2(0.5));
      // pattern 29 (sun?)
      // float strength = 0.02 / distance(vUv, vec2(0.5));
      // pattern 30
      // float position1 = 0.5;
      // float stretch = 0.8;
      // float squeeze = 1.0 - stretch;
      // float offset = position1 - (squeeze * 0.5);
      // float strength = 0.02 / distance(vec2(vUv.x * squeeze + offset, vUv.y) , vec2(position1));
      // pattern 31
      // float position2 = 0.5;
      // float stretchH = 0.8;
      // float squeezeH = 1.0 - stretchH;
      // float offsetH = position2 - (squeezeH * 0.5);
      // float flare1 = 0.02 / distance(vec2(vUv.x * squeezeH + offsetH, vUv.y) , vec2(position2));
      // float locationY = 0.5;
      // float stretchV = 0.8;
      // float squeezeV = 1.0 - stretchV;
      // float offsetV = locationY - (squeezeV * 0.5);
      // float flare2 = 0.02 / distance(vec2(vUv.x, vUv.y * squeezeV + offsetV) , vec2(locationY));
      // float strength = flare1 + flare2;
      // pattern 32
      // float rotation = PI * 0.25;
      // vec2 pivot = vec2(0.5);
      // vec2 rotatedUV = rotate(vUv, rotation, pivot);
      // float position1 = 0.5;
      // float stretchH = 0.8;
      // float squeezeH = 1.0 - stretchH;
      // float offsetH = position1 - (squeezeH * 0.5);
      // float flare1 = 0.02 / distance(
      //   vec2(rotatedUV.x * squeezeH + offsetH, rotatedUV.y),
      //   vec2(position1)
      // );
      // float position2 = 0.5;
      // float stretchV = 0.8;
      // float squeezeV = 1.0 - stretchV;
      // float offsetV = position2 - (squeezeV * 0.5);
      // float flare2 = 0.02 / distance(
      //   vec2(rotatedUV.x, rotatedUV.y * squeezeV + offsetV),
      //   vec2(position2)
      // );
      // float strength = flare1 + flare2;
      // pattern 33
      // float strength = step(0.2, distance(vUv, vec2(0.5)));
      // pattern 34
      // float strength = abs(distance(vUv, vec2(0.5)) - 0.2);
      // pattern 35
      // float strength = step(0.01, abs(distance(vUv, vec2(0.5)) - 0.2));
      // pattern 36
      // float strength = 1.0 - step(0.01, abs(distance(vUv, vec2(0.5)) - 0.2));
      // pattern 37
      // vec2 waveUV = vec2(vUv.x, vUv.y + sin(vUv.x * 30.0) * 0.1);
      // float strength = 1.0 - step(0.01, abs(distance(waveUV, vec2(0.5)) - 0.25));
      // pattern 38
      // vec2 waveUV = vec2(
      //   vUv.x + sin(vUv.y * 30.0) * 0.1,
      //   vUv.y + sin(vUv.x * 30.0) * 0.1
      // );
      // float strength = 1.0 - step(0.01, abs(distance(waveUV, vec2(0.5)) - 0.25));
      // pattern 39
      // vec2 waveUV = vec2(
      //   vUv.x + sin(vUv.y * 100.0) * 0.1,
      //   vUv.y + sin(vUv.x * 100.0) * 0.1
      // );
      // float strength = 1.0 - step(0.01, abs(distance(waveUV, vec2(0.5)) - 0.25));
      // pattern 40
      // float angle = atan(vUv.x, vUv.y);
      // float strength = angle;
      // pattern 41
      // float angle = atan(vUv.x - 0.5, vUv.y - 0.5);
      // float strength = angle;
      // pattern 42
      // float angle = atan(vUv.x - 0.5, vUv.y - 0.5) / (PI * 2.0) + 0.5;
      // float strength = angle;
      // pattern 43
      // float angle = atan(vUv.x - 0.5, vUv.y - 0.5) / (PI * 2.0) + 0.5;
      // float strength = mod(angle * 20.0, 1.0);
      // pattern 44
      // float angle = atan(vUv.x - 0.5, vUv.y - 0.5) / (PI * 2.0) + 0.5;
      // float strength = sin(angle * 100.0);
      // pattern 45
      // float angle = atan(vUv.x - 0.5, vUv.y - 0.5) / (PI * 2.0) + 0.5;
      // float sinusoid = sin(angle * 100.0);
      // float radius = 0.2 + sinusoid * 0.02;
      // float circle = 1.0 - step(0.01, abs(distance(vUv, vec2(0.5)) - radius));
      // float strength = circle;
      // pattern 46 (perlin)
      // float strength = cnoise(vUv * 10.0);
      // pattern 47
      // float strength = step(0.0, cnoise(vUv * 10.0));
      // pattern 48
      // float strength = 1.0 - abs(cnoise(vUv * 10.0));
      // pattern 49
      // float strength = sin(cnoise(vUv * 10.0) * 20.0);
      // pattern 50
      // float strength = step(0.8, sin(cnoise(vUv * 10.0) * 20.0));
      // pattern 51
      // float strength = step(0.8, sin(cnoise(vUv * 10.0) * 20.0));
      // strength = clamp(strength, 0.0, 1.0);
      // vec3 black = vec3(0.0);
      // vec3 uvColor = vec3(vUv, 1.0);
      // vec3 mixedColor = mix(black, uvColor, strength);
      // outColor = vec4(mixedColor, 1.0);

      // float strength = cnoise(vUv * 8.0) - 0.2;
      // strength = 1.0 / strength;

      // float height = cnoise(vUv * 10.0);
      // height = abs(height);


      // outColor = vec4(vec3(height), 1.0);
    }
  `,
};

export default shader_02;
