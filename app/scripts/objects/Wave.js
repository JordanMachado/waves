const THREE = require('three');

const glslify = require('glslify');

export default class Wave extends THREE.Object3D {
  constructor() {
    super();

    const loader = new THREE.TextureLoader();

    loader.load('./map.jpg', (texture) => {
      this.uniforms.map.value = texture;
      this.uniforms.map.needsUpdate = true;
    });
    loader.load('./normal.jpg', (texture) => {
      this.uniforms.normalMap.value = texture;
      this.uniforms.normalMap.needsUpdate = true;
    });

    const geo = new THREE.PlaneGeometry(100, 100, 100, 100);

    this.geom = new THREE.PlaneBufferGeometry(100, 100, 100, 100);
    this._waves = [];
    this.index = 0;
    this.waves = [];
    this.wavesCenter = [];
    for (let i = 0; i < 10; i++) {
      this.waves.push(new THREE.Vector3());
      this.wavesCenter.push(new THREE.Vector3());
    }


    this.startTime = Date.now();
    this.time = 0;
    this.uniforms = THREE.UniformsUtils.merge([
      THREE.UniformsLib.common,
      THREE.UniformsLib.aomap,
      THREE.UniformsLib.lightmap,
      THREE.UniformsLib.emissivemap,
      THREE.UniformsLib.bumpmap,
      THREE.UniformsLib.normalmap,
      THREE.UniformsLib.displacementmap,
      THREE.UniformsLib.fog,
      THREE.UniformsLib.lights,
      {
        emissive: { type: 'c', value: new THREE.Color(0x000000) },
        specular: { type: 'c', value: new THREE.Color(0x111111) },
        shininess: { type: '1f', value: 300 },
        normalScale: { type: 'v2', value: new THREE.Vector2(1, 1) },
        time: {
          type: 'f',
          value: this.time,
        },
        waves: {
          type: 'v3v',
          value: this.waves,
        },
        wavesCenter: {
          type: 'v3v',
          value: this.wavesCenter,
        },
        map: {
          type: 't',
          value: new THREE.Texture(),
        },
        normalMap: {
          type: 't',
          value: new THREE.Texture(),
        },
      },
    ]);


    this.mat = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: glslify('./wave.vert'),
      fragmentShader: glslify('./wave.frag'),
      wireframe: false,
      transparent: true,
      side: THREE.DoubleSide,
      lights: true,
      fog: true,
      extensions: {
        derivatives: true,
      },
      defines: {
        USE_MAP: true,
        USE_NORMALMAP: true,

      },
    });

    this.mesh = new THREE.Mesh(this.geom, this.mat);
    this.mesh.rotation.x = Math.PI / 180 * -60;
    this.add(this.mesh);
  }
  click(point) {
    const waveHeight = Math.random() * (10 - 2) + 2;
    const waveLength = Math.random() * (20 - 2) + 2;
    const vector = new THREE.Vector3(0, waveHeight, waveLength);
    this.wavesCenter[this.index] = point;
    this.waves[this.index] = vector;
    const duration = Math.random() * (3 - 1) + 1;
    TweenLite.to(vector, duration, {
      x: 50,
      y: 0,
      onComplete: () => {
        this.waves[this.index].x = 0;
        this.waves[this.index].y = 0;
        this.waves[this.index].z = 0;
      },
    });
    if (this.index < this.waves.length - 1) {
      this.index += 1;
    } else {
      this.index = 0;
    }

  }
  updateMouseProjection(uv) {
    this.uniforms.mouseUv.value = uv;
  }
  update() {
    this.uniforms.waves.value = this.waves;
    this.uniforms.wavesCenter.value = this.wavesCenter;
    this.uniforms.time.value = 0.0025 * (Date.now() - this.startTime);
  }
}
