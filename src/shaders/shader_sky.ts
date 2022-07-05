const shader_sky = {
  vertex: /*glsl*/ `
    out vec3 vWorldPosition;
    

    void main() {

      vec4 worldPosition = modelMatrix * vec4( position, 1.0 );
      vWorldPosition = worldPosition.xyz;

      gl_Position =
        projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
    }
  `,
  fragment: /*glsl*/ `
    uniform vec3 topColor;
    uniform vec3 bottomColor;
    uniform float offset;
    uniform float exponent;
    
    in vec3 vWorldPosition;
    
    out vec4 outColor;
    
    void main() {

      float h = normalize( vWorldPosition + offset ).y;
      outColor = vec4( mix( bottomColor, topColor, max( pow( max( h , 0.0), exponent ), 0.0 ) ), 1.0 );

    }
  `,
};

export default shader_sky;
