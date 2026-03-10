import { createScopedThreejs } from 'threejs-miniprogram'

const packTypeColors = {
  '围板箱': 0x3b82f6,
  '纸箱': 0xfbbf24,
  '木箱': 0xef4444,
  '托': 0x22c55e,
  '托盘': 0x22c55e,
  '铁框': 0x8b5cf6
}

Component({
  properties: {
    trucks: {
      type: Array,
      value: []
    }
  },

  data: {
    currentIndex: 0,
    currentTruck: null,
    inited: false
  },

  observers: {
    'trucks': function(newVal) {
      if (newVal && newVal.length > 0) {
        this.setData({
          currentIndex: 0,
          currentTruck: newVal[0]
        })
        if (this.data.inited) {
          this.renderCurrentTruck()
        } else {
          this.initThree()
        }
      }
    }
  },

  lifetimes: {
    detached() {
      if (this.renderer) {
        this.renderer.dispose()
        this.renderer = null
      }
      this.THREE = null
      this.scene = null
      this.camera = null
    }
  },

  methods: {
    initThree() {
      if (this.data.inited) return

      const query = wx.createSelectorQuery().in(this)
      query.select('#binPackingCanvas')
        .fields({ node: true, size: true })
        .exec((res) => {
          if (!res || !res[0] || !res[0].node) {
            console.error('Canvas not found')
            return
          }

          const canvas = res[0].node
          const width = res[0].width
          const height = res[0].height

          const THREE = createScopedThreejs(canvas)
          this.THREE = THREE

          const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
          renderer.setSize(width, height)
          renderer.setPixelRatio(wx.getSystemInfoSync().pixelRatio)
          this.renderer = renderer

          const scene = new THREE.Scene()
          scene.background = new THREE.Color(0x1a1a2e)
          this.scene = scene

          const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000)
          camera.position.set(15, 10, 15)
          camera.lookAt(0, 0, 0)
          this.camera = camera

          const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
          scene.add(ambientLight)

          const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
          directionalLight.position.set(10, 20, 10)
          scene.add(directionalLight)

          this.setData({ inited: true })
          this.renderCurrentTruck()
        })
    },

    renderCurrentTruck() {
      const { currentTruck } = this.data
      const { THREE, scene, camera, renderer } = this

      if (!THREE || !scene || !camera || !renderer || !currentTruck) return

      // 清除旧物体（保留灯光）
      const toRemove = []
      scene.children.forEach(child => {
        if (child.type !== 'AmbientLight' && child.type !== 'DirectionalLight') {
          toRemove.push(child)
        }
      })
      toRemove.forEach(obj => scene.remove(obj))

      const truckL = parseFloat(currentTruck.truckLength) || 9.5
      const truckW = parseFloat(currentTruck.truckWidth) || 2.3
      const truckH = parseFloat(currentTruck.truckHeight) || 2.5

      // 车厢底板
      const floorGeo = new THREE.BoxGeometry(truckL, 0.1, truckW)
      const floorMat = new THREE.MeshLambertMaterial({ color: 0x4a5568 })
      const floor = new THREE.Mesh(floorGeo, floorMat)
      floor.position.set(truckL / 2, -0.05, truckW / 2)
      scene.add(floor)

      // 车厢边框
      const wallMat = new THREE.MeshLambertMaterial({
        color: 0x718096,
        transparent: true,
        opacity: 0.3
      })

      if (currentTruck.truckStyle === '厢式') {
        // 后墙
        const backWall = new THREE.Mesh(new THREE.BoxGeometry(0.05, truckH, truckW), wallMat)
        backWall.position.set(0, truckH / 2, truckW / 2)
        scene.add(backWall)

        // 左右墙
        const leftWall = new THREE.Mesh(new THREE.BoxGeometry(truckL, truckH, 0.05), wallMat)
        leftWall.position.set(truckL / 2, truckH / 2, 0)
        scene.add(leftWall)

        const rightWall = new THREE.Mesh(new THREE.BoxGeometry(truckL, truckH, 0.05), wallMat)
        rightWall.position.set(truckL / 2, truckH / 2, truckW)
        scene.add(rightWall)

        // 顶棚
        const roof = new THREE.Mesh(new THREE.BoxGeometry(truckL, 0.05, truckW), wallMat)
        roof.position.set(truckL / 2, truckH, truckW / 2)
        scene.add(roof)
      } else if (currentTruck.truckStyle === '高栏') {
        const railH = 0.5
        const railMat = new THREE.MeshLambertMaterial({ color: 0x718096 })

        const leftRail = new THREE.Mesh(new THREE.BoxGeometry(truckL, railH, 0.05), railMat)
        leftRail.position.set(truckL / 2, railH / 2, 0)
        scene.add(leftRail)

        const rightRail = new THREE.Mesh(new THREE.BoxGeometry(truckL, railH, 0.05), railMat)
        rightRail.position.set(truckL / 2, railH / 2, truckW)
        scene.add(rightRail)

        const backRail = new THREE.Mesh(new THREE.BoxGeometry(0.05, railH, truckW), railMat)
        backRail.position.set(0, railH / 2, truckW / 2)
        scene.add(backRail)
      }

      // 绘制货物
      if (currentTruck.positions && currentTruck.positions.length > 0) {
        currentTruck.positions.forEach(pos => {
          // 所有单位都是米，直接使用
          const l = parseFloat(pos.length)
          const w = parseFloat(pos.width)
          const h = parseFloat(pos.height)
          const x = parseFloat(pos.x)
          const y = parseFloat(pos.y)
          const z = parseFloat(pos.z)

          const color = packTypeColors[pos.packType] || 0x9ca3af
          const geo = new THREE.BoxGeometry(l, h, w)
          const mat = new THREE.MeshLambertMaterial({ color })
          const mesh = new THREE.Mesh(geo, mat)
          mesh.position.set(x + l / 2, y + h / 2, z + w / 2)
          scene.add(mesh)

          // 边框线
          const edges = new THREE.EdgesGeometry(geo)
          const lineMat = new THREE.LineBasicMaterial({ color: 0x000000 })
          const wireframe = new THREE.LineSegments(edges, lineMat)
          wireframe.position.copy(mesh.position)
          scene.add(wireframe)
        })
      }

      // 调整相机位置
      const centerX = truckL / 2
      const centerZ = truckW / 2
      camera.position.set(centerX + 12, 8, centerZ + 12)
      camera.lookAt(centerX, truckH / 2, centerZ)

      renderer.render(scene, camera)
    },

    onTouchStart(e) {
      const touch = e.touches[0]
      this.lastTouchX = touch.clientX
      this.lastTouchY = touch.clientY
      this.rotationY = this.rotationY || 0.8
      this.rotationX = this.rotationX || 0.3
    },

    onTouchMove(e) {
      const { camera, renderer, scene } = this
      const { currentTruck } = this.data
      if (!camera || !currentTruck) return

      const touch = e.touches[0]
      const deltaX = touch.clientX - this.lastTouchX
      const deltaY = touch.clientY - this.lastTouchY

      this.rotationY += deltaX * 0.01
      this.rotationX += deltaY * 0.01
      this.rotationX = Math.max(-1, Math.min(1, this.rotationX))

      const truckL = parseFloat(currentTruck.truckLength) || 9.5
      const truckW = parseFloat(currentTruck.truckWidth) || 2.3
      const truckH = parseFloat(currentTruck.truckHeight) || 2.5
      const centerX = truckL / 2
      const centerZ = truckW / 2

      const radius = 15
      camera.position.x = centerX + radius * Math.sin(this.rotationY) * Math.cos(this.rotationX)
      camera.position.y = 5 + radius * Math.sin(this.rotationX)
      camera.position.z = centerZ + radius * Math.cos(this.rotationY) * Math.cos(this.rotationX)
      camera.lookAt(centerX, truckH / 2, centerZ)

      renderer.render(scene, camera)

      this.lastTouchX = touch.clientX
      this.lastTouchY = touch.clientY
    },

    onTouchEnd() {},

    prevTruck() {
      const { currentIndex, trucks } = this.data
      if (currentIndex > 0) {
        this.setData({
          currentIndex: currentIndex - 1,
          currentTruck: trucks[currentIndex - 1]
        })
        this.renderCurrentTruck()
      }
    },

    nextTruck() {
      const { currentIndex, trucks } = this.data
      if (currentIndex < trucks.length - 1) {
        this.setData({
          currentIndex: currentIndex + 1,
          currentTruck: trucks[currentIndex + 1]
        })
        this.renderCurrentTruck()
      }
    }
  }
})
