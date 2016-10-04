const THREE = require('three');
window.THREE = THREE;
const OrbitControls = require('three-orbit-controls')(THREE);
import WAGNER from '@superguigui/wagner';

// Passes
const FXAAPass = require('@superguigui/wagner/src/passes/fxaa/FXAAPASS');
const VignettePass = require('@superguigui/wagner/src/passes/vignette/VignettePass');
const NoisePass = require('@superguigui/wagner/src/passes/noise/noise');
import Wave from './objects/Wave';
// Objects


export default class WebGL {
  constructor(params) {
    this.params = {
      name: params.name || 'WebGL',
      device: params.device || 'desktop',
      postProcessing: params.postProcessing || false,
      keyboard: params.keyboard || false,
      mouse: params.mouse || false,
      touch: params.touch || false,
      controls: params.controls || false,
    };
    this.tick = 0;
    this.mouse = new THREE.Vector2();
    this.originalMouse = new THREE.Vector2();
    this.raycaster = new THREE.Raycaster();

    this.scene = new THREE.Scene();
    // this.scene.fog = new THREE.FogExp2(0xADADAD, 0.0015);
    this.scene.fog = new THREE.FogExp2(0x262626, 0.005);

    this.camera = new THREE.PerspectiveCamera(50, params.size.width / params.size.height, 1, 1000);
    this.camera.position.z = 100;

    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setSize(params.size.width, params.size.height);
    this.renderer.setClearColor(0x262626);
    // this.renderer.setClearColor(0xADADAD);


    this.composer = null;
    this.initPostprocessing();


    this.initLights();
    this.initObjects();
    if (this.params.controls) {
      this.controls = new OrbitControls(this.camera);
    }
    if (window.DEBUG || window.DEVMODE) this.initGUI();

  }
  initPostprocessing() {
    this.composer = new WAGNER.Composer(this.renderer);
    this.composer.setSize(window.innerWidth, window.innerHeight);
    window.composer = this.composer;

    // Add pass and automatic gui
    this.passes = [];
    this.fxaaPass = new FXAAPass();
    this.passes.push(this.fxaaPass);
    this.noisePass = new NoisePass();
    this.noisePass.params.amount = 0.04;
    this.noisePass.params.speed = 1;
    this.passes.push(this.noisePass);
    this.vignettePass = new VignettePass({});
    this.passes.push(this.vignettePass);

  }
  initLights() {
    this.lights = new THREE.Group();

    const colors = [
      '#c947f9',
      '#47f9f3',
    ];
    for (let i = 0; i < 8; i++) {
      const color = colors[Math.floor(Math.random() * colors.length)];
      const light = new THREE.PointLight(color, 0, 100);
      TweenMax.to(light, 2, {
        intensity: 1,
      });
      light.position.x = Math.random() * (50 - -50) + -50;
      light.position.y = Math.random() * (50 - -50) + -50;
      light.position.z = Math.random() * (50 - -50) + -50;
      light.tick = Math.random() * (1 - -1) + -1;
      light.radius = Math.random() * (30 + -30) + -30;
      light.originalPos = new THREE.Vector3();
      light.originalPos = light.position.clone();
      // light.position.z = -20;
      this.lights.add(light);
    }
    this.scene.add(this.lights);
  }
  initObjects() {
    this.wave = new Wave();
    this.wave.position.set(0, 0, 0);
    this.scene.add(this.wave);
  }
  initGUI() {
    this.folder = window.gui.addFolder(this.params.name);
    this.folder.add(this.params, 'postProcessing');
    this.folder.add(this.params, 'keyboard');
    this.folder.add(this.params, 'mouse');
    this.folder.add(this.params, 'touch');
    this.folder.add(this.params, 'controls');


    // init postprocessing GUI
    this.postProcessingFolder = this.folder.addFolder('PostProcessing');
    for (let i = 0; i < this.passes.length; i++) {
      const pass = this.passes[i];
      pass.enabled = true;
      let containsNumber = false;
      for (const key of Object.keys(pass.params)) {
        if (typeof pass.params[key] === 'number') {
          containsNumber = true;
        }
      }
      const folder = this.postProcessingFolder.addFolder(pass.constructor.name);
      folder.add(pass, 'enabled');
      if (containsNumber) {
        for (const key of Object.keys(pass.params)) {
          if (typeof pass.params[key] === 'number') {
            folder.add(pass.params, key);
          }
        }
      }
      folder.open();
    }
    this.postProcessingFolder.open();

    // init scene.child GUI
    for (let i = 0; i < this.scene.children.length; i++) {
      const child = this.scene.children[i];
      if (typeof child.addGUI === 'function') {
        child.addGUI(this.folder);
      }
    }
    this.folder.open();
  }
  render() {
    if (this.params.postProcessing) {
      this.composer.reset();
      this.composer.render(this.scene, this.camera);

      // Passes
      for (let i = 0; i < this.passes.length; i++) {
        if (this.passes[i].enabled) {
          this.composer.pass(this.passes[i]);
        }
      }

      this.composer.toScreen();

    } else {
      this.renderer.render(this.scene, this.camera);
    }
    this.wave.update();
    this.tick += 0.01;

    for (let i = 0; i < this.lights.children.length; i++) {
      const light = this.lights.children[i];
      light.position.x = light.originalPos.x + light.radius * Math.cos(this.tick * light.tick);
      light.position.y = light.originalPos.y + light.radius * Math.sin(this.tick * light.tick);
      light.position.z = light.originalPos.z + light.radius * Math.cos(this.tick * light.tick);
    }

  }
  rayCast() {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObject(this.wave, true);
    if (intersects.length > 0) {
      this.wave.click(intersects[0].point);
    }
  }
  // Events
  resize(width, height) {
    if (this.composer) {
      this.composer.setSize(width, height);
    }

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
  }
  keyPress() {
    if (!this.params.keyboard) return;

  }
  keyDown() {
    if (!this.params.keyboard) return;

  }
  keyUp() {
    if (!this.params.keyboard) return;

  }
  click(x, y, time) {
    if (!this.params.mouse) return;

    this.originalMouse.x = x;
    this.originalMouse.y = y;
    this.mouse.x = (x / window.innerWidth - 0.5) * 2;
    this.mouse.y = - (y / window.innerHeight - 0.5) * 2;
    this.rayCast();
  }
  mouseMove(x, y, ime) {
    if (!this.params.mouse) return;

    this.originalMouse.x = x;
    this.originalMouse.y = y;
    this.mouse.x = (x / window.innerWidth - 0.5) * 2;
    this.mouse.y = - (y / window.innerHeight - 0.5) * 2;
  }
  touchStart(touches) {
    if (!this.params.touch) return;
    const touch = touches[0];
    this.originalMouse.x = touch.clientX;
    this.originalMouse.y = touch.clientY;
    this.mouse.x = (touch.clientX / window.innerWidth - 0.5) * 2;
    this.mouse.y = - (touch.clientY / window.innerHeight - 0.5) * 2;
    this.rayCast();

  }
  touchEnd() {
    if (!this.params.touch) return;
  }
  touchMove() {
    if (!this.params.touch) return;

  }

}
