#define PHONG
varying vec3 vViewPosition;

#ifndef FLAT_SHADED

	varying vec3 vNormal;

#endif

#include <common>
#include <uv_pars_vertex>
#include <uv2_pars_vertex>
#include <displacementmap_pars_vertex>

#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>


#pragma glslify: pnoise = require(glsl-noise/periodic/3d)

const int WAVENUM = 10;
varying float elevation;
uniform float time;
uniform vec3 waves[WAVENUM];
uniform vec3 wavesCenter[WAVENUM];
uniform sampler2D map;

float getWaveElevation (vec3 pos) {
	float e = 0.0;
	float distToWave;
	float distToWaveFront;
	float waveFront;
	float waveHeight;
	float waveLength;

	for (int i = 0; i < WAVENUM; i++) {
		vec3 waveCenter = wavesCenter[i];
		waveFront =  waves[i].x;
		waveHeight =  waves[i].y;
		waveLength =  waves[i].z;
		float disToWave = distance(waveCenter, pos);
		float distWaveFront = distance(disToWave, waveFront);
		if(distWaveFront < waveLength) {
			float tmp = 1.0 - (distWaveFront / waveLength);
			tmp = pow(sin(tmp), 2.0);
			e += tmp * waveHeight;
		}
	}
	return e;
}



void main() {

	#include <uv_vertex>
	#include <uv2_vertex>
	#include <color_vertex>

	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>

#ifndef FLAT_SHADED // Normal computed with derivatives when FLAT_SHADED

	vNormal = normalize( transformedNormal );

#endif

	#include <begin_vertex>
	#include <displacementmap_vertex>


		vec4 p = vec4(position,1.0);

		vec3 texture = texture2D(map,uv).rbg;
		p.z += texture.r * 5.0;

		elevation = getWaveElevation(position);
		p.z += elevation;
		float noise = pnoise(vec3(p.x, p.y, p.z + time * 0.5), vec3(180.0,10.0,10.0));
		p.z += noise;

		transformed = p.xyz;


	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>

	vViewPosition = - mvPosition.xyz;

	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>

}
