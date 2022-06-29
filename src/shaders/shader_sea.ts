const shader_sea = {
  vertex: /*glsl*/ `
    uniform float uTime;
    in float aValues;

    out float vValues;
    out vec3 vNormalInterpolation;
    out vec3 vViewPosition;
    out vec2 vUv;
    out float vTime;
    out float vHeight;

    //	Classic Perlin 2D Noise 
    //	by Stefan Gustavson
    //
    vec4 permute(vec4 x) {
      return mod(((x*34.0)+1.0)*x, 289.0);
    }
    vec2 fade(vec2 t) {return t*t*t*(t*(t*6.0-15.0)+10.0);}
    float classicPerlinNoise(vec2 P) {
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
      // waves
      float waveElevation = 2.0;
      float waveFrequency = 8.0;
      float wave = sin(modelPosition.x * waveFrequency + uTime);
      wave *= sin(modelPosition.z * waveFrequency + (uTime * 0.1));
      wave *= waveElevation;
      modelPosition.y += wave;
      // noise
      float height = classicPerlinNoise(uv * 50.0 + (uTime * 0.25));
      height *= 2.0;
      modelPosition.y += height;
      vec4 viewPosition = viewMatrix * modelPosition;
      vec4 projectedPosition = projectionMatrix * viewPosition;
      gl_Position = projectedPosition;
      vValues = aValues;
      vNormalInterpolation = normalMatrix * normal;
      vViewPosition = vec3(viewPosition) / viewPosition.w;
      vUv = uv;
      vTime = uTime;
      vHeight = height;
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
    in float vHeight;
    out vec4 outColor;

    const vec3 ambientColor = vec3(0.0);
    vec3 diffuseColor = vec3(0.4,0.6,0.9);
    const vec3 specularColor 	= vec3(0.1, 0.1, 0.1);
    // const vec3 specularColor 	= vec3(vHeight, vHeight, vHeight);

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
        specular *= clamp(vHeight, 0.0, 0.5);
      }
      diffuseColor = mix(vec3(vHeight), diffuseColor, 0.98);
      // float shading = clamp(dot(lightDirection, normal), 0.8, 1.0);
      outColor = vec4(ambientColor + lambertian * diffuseColor + specular * specularColor, 0.6);
      // outColor = vec4(vec3(vHeight), 1.0);
    }
  `,
};

export default shader_sea;
