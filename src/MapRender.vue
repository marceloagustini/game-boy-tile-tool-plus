<script setup>
import { onMounted, onUnmounted, ref, watch } from 'vue'

const emit = defineEmits(['paint'])

const props = defineProps({
    map: Array,
    mapWidth: Number,
    mapHeight: Number,
    sprites: Array,
    showGrid: Boolean,
    tool: String,
})

const colors = {
    0: '--color-lightest',
    1: '--color-light',
    2: '--color-dark',
    3: '--color-darkest',
}

const mouseDown = ref(false)
const middleDown = ref(false)

const xScale = ref(3)
const yScale = ref(3)

const xOffset = ref(8)
const yOffset = ref(8)

const sendPaintEvent = (event) => {
    const rect = canvas.value.getBoundingClientRect()
    const x = Math.floor((event.clientX - rect.left - xOffset.value) / xScale.value / 8)
    if (x < 0 || x >= props.mapWidth) return
    const y = Math.floor((event.clientY - rect.top - yOffset.value) / yScale.value / 8)
    if (y < 0 || y >= props.mapHeight) return
    const index = x + y * props.mapWidth
    if (index < 0 || index >= props.map.length) return
    emit('paint', index)
}

const oldMouseX = ref(null)
const oldMouseY = ref(null)

const dragView = (event) => {
    if (oldMouseX.value !== null && oldMouseY.value !== null) {
        xOffset.value += (event.clientX - oldMouseX.value)
        yOffset.value += (event.clientY - oldMouseY.value)
        render()
    }
    oldMouseX.value = event.clientX
    oldMouseY.value = event.clientY
}

const canvas = ref(null)

const render = () => {
    if (!canvas.value) return

    const ctx = canvas.value.getContext('2d')
    ctx.resetTransform()
    ctx.clearRect(0, 0, canvas.value.width, canvas.value.height);
    ctx.transform(xScale.value, 0, 0, yScale.value, xOffset.value, yOffset.value)

    const computedStyle = getComputedStyle(canvas.value)
    for (let x = 0; x < props.mapWidth; x++) {
        for (let y = 0; y < props.mapHeight; y++) {
            const sprite = props.sprites[props.map[x + y * props.mapWidth]] ?? 0
            for (let i = 0; i < 64; i++) {
                const sx = i % 8
                const sy = Math.floor(i / 8)
                ctx.fillStyle = `rgb(${computedStyle.getPropertyValue(colors[sprite[i]])})`
                ctx.fillRect(x * 8 + sx, y * 8 + sy, 1, 1)
            }
        }
    }

    if (props.showGrid) {
        ctx.strokeStyle = '#888'
        ctx.lineWidth = 0.5 // Scaled by transform, might need adjustment or reset transform
        // Drawing grid based on map dimensions
        ctx.beginPath()
        for (let x = 0; x <= props.mapWidth; x++) {
            ctx.moveTo(x * 8, 0)
            ctx.lineTo(x * 8, props.mapHeight * 8)
        }
        for (let y = 0; y <= props.mapHeight; y++) {
            ctx.moveTo(0, y * 8)
            ctx.lineTo(props.mapWidth * 8, y * 8)
        }
        ctx.stroke()
    }
}

watch(() => props.map, render, { deep: true })
watch(() => props.mapWidth, render)
watch(() => props.mapHeight, render)
watch(() => props.map, render, { deep: true })
watch(() => props.mapWidth, render)
watch(() => props.mapHeight, render)
watch(() => props.sprites, render, { deep: true })
watch(() => props.showGrid, render)

const width = ref(333)
const height = ref(333)

let resizeObserver

onMounted(() => {
    if (canvas.value) {
        resizeObserver = new ResizeObserver((entries) => {
            const entry = entries[0]
            if (entry) {
                 width.value = entry.contentRect.width
                 height.value = entry.contentRect.height
                 requestAnimationFrame(render)
            }
        })
        resizeObserver.observe(canvas.value)
    }
    render()
})

onUnmounted(() => {
    if (resizeObserver) resizeObserver.disconnect()
})
</script>

<template>
    <canvas
        @mousedown.left="(event) => {
            if (props.tool === 'hand') {
                middleDown = true; // Use same flag as middle click for dragging
                oldMouseX = event.clientX;
                oldMouseY = event.clientY;
            } else {
                mouseDown = true; 
                sendPaintEvent(event);
            }
        }"
        @mouseup.left="mouseDown = false; middleDown = false"
        @mousedown.middle="middleDown = true"
        @mouseup.middle="middleDown = false; oldMouseX = null; oldMouseY = null"
        @wheel="event => {
            if (event.deltaY > 0) {
                xScale = Math.max(1, xScale - 1)
                yScale = Math.max(1, yScale - 1)
            } else {
                xScale = Math.min(5, xScale + 1)
                yScale = Math.min(5, yScale + 1)
            }
            render()
        }"
        @mousemove="(event) => {
            if (mouseDown && props.tool !== 'hand') { sendPaintEvent(event) }
            else if (middleDown) { dragView(event) }
        }"
        @mouseleave="mouseDown = false; middleDown = false"
        class="block w-full h-full select-none"
        :width="width"
        :height="height"
        ref="canvas"
    ></canvas>
</template>