<script setup>
import { onMounted, ref, watch } from 'vue'

const props = defineProps({
    data: Array,
    scale: {
        type: Number,
        default: 2
    }
})

const colors = {
    0: '--color-lightest',
    1: '--color-light',
    2: '--color-dark',
    3: '--color-darkest',
}

const canvas = ref(null)

const render = () => {
    if (!canvas.value || !props.data) return

    const ctx = canvas.value.getContext('2d')
    const computedStyle = getComputedStyle(canvas.value)
    
    // Clear
    ctx.clearRect(0, 0, canvas.value.width, canvas.value.height)
    
    for (let i = 0; i < 256; i++) {
        const x = i % 16
        const y = Math.floor(i / 16)
        ctx.fillStyle = `rgb(${computedStyle.getPropertyValue(colors[props.data[i]])})`
        ctx.fillRect(x, y, 1, 1)
    }
}

watch(() => props.data, render, { deep: true })

onMounted(() => {
    const ctx = canvas.value.getContext('2d')
    ctx.scale(props.scale, props.scale)
    render()
})
</script>

<template>
    <canvas ref="canvas" :width="16 * scale" :height="16 * scale"></canvas>
</template>
