const shader_01 = {
  vertex: /*glsl*/ `
    uniform mat4 modelMatrix;
    uniform mat4 viewMatrix;
    uniform mat4 projectionMatrix;
    uniform mat3 normalMatrix;
    uniform float uTime;

    in vec3 position;
    in vec3 normal;
    in float aValues;

    out float vValues;
    out vec3 vNormalInterpolation;
    out vec3 vViewPosition;

    void main()
    {
      vec4 modelPosition = modelMatrix * vec4(position, 1.0);
      modelPosition.y += sin(aValues * 2.0) * 1.0;
      modelPosition.z += sin(aValues * 2.0) * 1.0;
      vec4 viewPosition = viewMatrix * modelPosition;
      vec4 projectedPosition = projectionMatrix * viewPosition;
      gl_Position = projectedPosition;
      vValues = aValues;
      vNormalInterpolation = normalMatrix * normal;
      vViewPosition = vec3(viewPosition) / viewPosition.w;
    }
  `,
  fragment: /*glsl*/ `
    precision mediump float;
    uniform vec3 uLightPosition;

    in float vValues;
    in vec3 vViewPosition;
    in vec3 vNormalInterpolation;
    out vec4 outColor;

    const vec3 ambientColor = vec3(0.0);
    const vec3 diffuseColor = vec3(0.369,0.643,0.4);
    const vec3 specularColor 	= vec3(0.1, 0.1, 0.1);


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
      outColor = vec4(ambientColor + lambertian * diffuseColor + specular * specularColor, 1.0);
      // outColor = vec4(diffuseColor, 1.0);
    }
  `,
};

export default shader_01;
