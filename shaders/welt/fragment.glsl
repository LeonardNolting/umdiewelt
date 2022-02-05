uniform sampler2D globeTexture;

varying vec2 vertexUV; // [0, 0.24]
varying vec3 vertexNormal;

/**
 * Adjusts the saturation of a color.
 *
 * @name czm_saturation
 * @glslFunction
 *
 * @param {vec3} rgb The color.
 * @param {float} adjustment The amount to adjust the saturation of the color.
 *
 * @returns {float} The color with the saturation adjusted.
 *
 * @example
 * vec3 greyScale = czm_saturation(color, 0.0);
 * vec3 doubleSaturation = czm_saturation(color, 2.0);
 */
vec3 czm_saturation(vec3 rgb, float adjustment)
{
    // Algorithm from Chapter 16 of OpenGL Shading Language
    const vec3 W = vec3(0.2125, 0.7154, 0.0721);
    vec3 intensity = vec3(dot(rgb, W));
    return mix(intensity, rgb, adjustment);
}

void main() {
  float intensity = 1.15 - dot(vertexNormal, vec3(0.0, 0.0, 1.0 ));
  vec3 atmosphere = vec3(0.3, 0.6, 1.0) * pow(intensity, 1.5);

  gl_FragColor = vec4(czm_saturation(atmosphere + texture2D(globeTexture, vertexUV).xyz, /*saturation:*/ 1.5), 1.0);
}
