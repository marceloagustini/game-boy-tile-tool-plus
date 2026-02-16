<script setup>
import { ref, computed } from 'vue'
import SpriteRender from './SpriteRender.vue';

import MetaSpriteRender from './MetaSpriteRender.vue';
import MapRender from './MapRender.vue';

const mode = ref('map') // 'map' or 'sprite'

const tilesetName = ref('Tileset')

const tool = ref('pencil')
const showGrid = ref(false)

const palette = ref('bw')
const clipboardTile = ref(null)
const clipboardFrame = ref(null)

const color  = ref(0)

const colors = {
    0: 'bg-lightest',
    1: 'bg-light',
    2: 'bg-dark',
    3: 'bg-darkest',
}

const maps = ref([
    {
        name: 'Map 1',
        width: 20,
        height: 18,
        oldWidth: 20,
        oldHeight: 18,
        data: Array(360).fill(0)
    }
])

const currentMapIndex = ref(0)
const currentMap = computed(() => maps.value[currentMapIndex.value])

const addMap = () => {
    maps.value.push({
        name: `Map ${maps.value.length + 1}`,
        width: 20,
        height: 18,
        oldWidth: 20,
        oldHeight: 18,
        data: Array(360).fill(0)
    })
    currentMapIndex.value = maps.value.length - 1
}

const removeMap = (index) => {
    if (maps.value.length > 1) {
        maps.value.splice(index, 1)
        if (currentMapIndex.value >= maps.value.length) {
            currentMapIndex.value = maps.value.length - 1
        }
    }
}

const animations = ref([])
const activeAnimIndex = ref(0)
const sidebarMode = ref('editor') // 'editor' or 'anims'

const addAnim = () => {
    animations.value.push({
        name: `Anim ${animations.value.length + 1}`,
        speed: 10,
        frames: []
    })
    activeAnimIndex.value = animations.value.length - 1
}

const removeAnim = (index) => {
    animations.value.splice(index, 1)
    if (activeAnimIndex.value >= animations.value.length) {
        activeAnimIndex.value = Math.max(0, animations.value.length - 1)
    }
}

const addFrame = () => {
    if (animations.value.length === 0) return
    animations.value[activeAnimIndex.value].frames.push(sprite.value)
}

const removeFrame = (frameIndex) => {
     if (animations.value.length === 0) return
     animations.value[activeAnimIndex.value].frames.splice(frameIndex, 1)
}

const collisionTiles = ref(new Set())

const toggleCollision = (index) => {
    if (collisionTiles.value.has(index)) {
        collisionTiles.value.delete(index)
    } else {
        collisionTiles.value.add(index)
    }
}

const allSprites = ref([
    [
        0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0,
    ],
])

const sprite = ref(0)

const addSprite = () => {
    allSprites.value.push([
        0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0,
    ])
    sprite.value = allSprites.value.length - 1
}

const fillPixel = (index, oldColor, newColor) => {
    if (allSprites.value[sprite.value][index] === oldColor) {
        allSprites.value[sprite.value][index] = color.value
        if (index % 8 !== 0) {
            fillPixel(index - 1, oldColor)
        }
        if (index % 8 !== 7) {
            fillPixel(index + 1, oldColor)
        }
        if (index > 7) {
            fillPixel(index - 8, oldColor)
        }
        if (index < 56) {
            fillPixel(index + 8, oldColor)
        }
    }
}

const spriteActors = ref([])
const activeActorIndex = ref(0)
const activeFrameIndex = ref(0)
const activeActor = computed(() => spriteActors.value[activeActorIndex.value])
const activeFrame = computed(() => activeActor.value ? activeActor.value.frames[activeFrameIndex.value] : null)

const addActor = () => {
    spriteActors.value.push({
        name: `Actor ${spriteActors.value.length + 1}`,
        frames: [Array(256).fill(0)]
    })
    activeActorIndex.value = spriteActors.value.length - 1
    activeFrameIndex.value = 0
}

const removeActor = (index) => {
    if (spriteActors.value.length > 0) {
        spriteActors.value.splice(index, 1)
        activeActorIndex.value = Math.max(0, activeActorIndex.value - 1)
        activeFrameIndex.value = 0
    }
}

const addActorFrame = () => {
    if (!activeActor.value) return
    const currentFrame = activeFrame.value
    const newFrame = currentFrame ? [...currentFrame] : Array(256).fill(0)
    activeActor.value.frames.push(newFrame)
    activeFrameIndex.value = activeActor.value.frames.length - 1
}

const removeActorFrame = (frameIndex) => {
    if (!activeActor.value || activeActor.value.frames.length <= 1) return
    activeActor.value.frames.splice(frameIndex, 1)
    if (activeFrameIndex.value >= activeActor.value.frames.length) {
        activeFrameIndex.value = activeActor.value.frames.length - 1
    }
}

const colorActorPixel = (index) => {
    if (!activeFrame.value) return
    if (tool.value === 'pencil') {
        activeFrame.value[index] = color.value
    } else if (tool.value === 'fill') {
        const oldColor = activeFrame.value[index]
        if (oldColor !== color.value) {
            fillActorPixel(index, oldColor)
        }
    }
}

const fillActorPixel = (index, oldColor) => {
    if (activeFrame.value[index] === oldColor) {
        activeFrame.value[index] = color.value
        // 16x16 grid logic
        const w = 16
        if (index % w !== 0) fillActorPixel(index - 1, oldColor)
        if (index % w !== w - 1) fillActorPixel(index + 1, oldColor)
        if (index >= w) fillActorPixel(index - w, oldColor)
        if (index < 256 - w) fillActorPixel(index + w, oldColor)
    }
}

const duplicateActorFrame = () => {
     if (!activeActor.value) return
     const currentFrame = activeFrame.value
     activeActor.value.frames.push([...currentFrame])
     activeFrameIndex.value = activeActor.value.frames.length - 1
}

const copyActorFrame = () => {
    if (!activeFrame.value) return;
    clipboardFrame.value = [...activeFrame.value];
    alert('Sprite Frame Copied!');
}

const pasteActorFrame = () => {
    if (!activeFrame.value || !clipboardFrame.value) return;
    activeActor.value.frames[activeFrameIndex.value] = [...clipboardFrame.value];
}

const copyTile = () => {
    clipboardTile.value = [...allSprites.value[sprite.value]];
    alert('Tile Copied!');
}

const pasteTile = () => {
    if (!clipboardTile.value) return;
    allSprites.value[sprite.value] = [...clipboardTile.value];
}

const colorPixel = (index) => {
    if (tool.value === 'pencil') {
        allSprites.value[sprite.value][index] = color.value
    }

    if (tool.value === 'fill') {
        const oldColor = allSprites.value[sprite.value][index]
        if (oldColor !== color.value) {
            fillPixel(index, oldColor)
        }
    }
}

const fillMap = (index, oldTile) => {
    if (currentMap.value.data[index] === oldTile) {
        currentMap.value.data[index] = sprite.value
        if (index % currentMap.value.width !== 0) {
            fillMap(index - 1, oldTile)
        }
        if (index % currentMap.value.width !== currentMap.value.width - 1) {
            fillMap(index + 1, oldTile)
        }
        if (index > currentMap.value.width - 1) {
            fillMap(index - currentMap.value.width, oldTile)
        }
        if (index < currentMap.value.width * (currentMap.value.height - 1)) {
            fillMap(index + currentMap.value.width, oldTile)
        }
    }
}

const colorMap = (index) => {
    if (tool.value === 'pencil') {
        currentMap.value.data[index] = sprite.value
    }

    if (tool.value === 'fill') {
        const oldTile = currentMap.value.data[index]
        if (oldTile !== sprite.value) {
            fillMap(index, oldTile)
        }
    }
}

const adjustMap = () => {
    const newMap = currentMap.value.data

    if (currentMap.value.height > currentMap.value.oldHeight) {
        // Add rows to bottom
        const valuesToAppend = (currentMap.value.height - currentMap.value.oldHeight) * currentMap.value.width
        newMap.push(...Array(valuesToAppend).fill(0))
    } else if (currentMap.value.height < currentMap.value.oldHeight) {
        // Remove rows from bottom
        const valuesToRemove = (currentMap.value.oldHeight - currentMap.value.height) * currentMap.value.width
        newMap.splice(newMap.length - valuesToRemove, valuesToRemove)
    }

    if (currentMap.value.width > currentMap.value.oldWidth) {
        // Add columns to end of each row
        const valuesToAppend = currentMap.value.width - currentMap.value.oldWidth
        for (let i = 0; i < currentMap.value.height; i++) {
            for (let j = 0; j < valuesToAppend; j++) {
                newMap.splice((i+1)*currentMap.value.width-1, 0, 0)
            }
        }
    } else if (currentMap.value.width < currentMap.value.oldWidth) {
        // Remove columns from end of each row
        const valuesToRemove = currentMap.value.oldWidth - currentMap.value.width
        for (let i = 0; i < currentMap.value.height; i++) {
            newMap.splice((i+1) * currentMap.value.width, valuesToRemove)
        }
    }

    currentMap.value.data = newMap

    currentMap.value.oldWidth = currentMap.value.width
    currentMap.value.oldHeight = currentMap.value.height
}

const generateOutput = () => {
    let output = 'unsigned char ' + tilesetName.value + 'Tiles[] =\n{\n    '

    const hexes = []

    for (let index in allSprites.value) {
        for (let i = 0; i < 8; i++) {
            const lsb = []
            const msb = []
            const pixels = allSprites.value[index].slice(i*8, i*8+8)
            pixels.forEach(pixel => {
                if (pixel === 0) {
                    lsb.push(0)
                    msb.push(0)
                }
                if (pixel === 1) {
                    lsb.push(1)
                    msb.push(0)
                }
                if (pixel === 2) {
                    lsb.push(0)
                    msb.push(1)
                }
                if (pixel === 3) {
                    lsb.push(1)
                    msb.push(1)
                }
            })
            let lsbHex = parseInt(lsb.join(''), 2).toString(16).toUpperCase()
            lsbHex = (lsbHex.length === 1 ? '0x0' : '0x') + lsbHex
            let msbHex = parseInt(msb.join(''), 2).toString(16).toUpperCase()
            msbHex = (msbHex.length === 1 ? '0x0' : '0x') + msbHex
            hexes.push(lsbHex)
            hexes.push(msbHex)
        }
    }

    for (let i = 0; i < hexes.length; i++) {
        if (i % 16 === 0 && i !== 0) {
            output += '\n    '
        }
        output += hexes[i] + ','
    }

    output += '\n};\n'

    maps.value.forEach(mapObj => {
        output += '\nunsigned char ' + mapObj.name.replace(/\s+/g, '') + 'Map[] =\n{\n    '
        for (let i = 0; i < mapObj.data.length; i++) {
            if (i % mapObj.width === 0 && i !== 0) {
                output += '\n    '
            }
            const hex = mapObj.data[i].toString(16).toUpperCase()
            output += '0x' + (hex.length === 1 ? '0' : '') + hex + ','
        }
        output += '\n};'
    })

    return output
}

const generateCollisionOutput = () => {
    let output = '\nconst unsigned char TilesetCollision[] = {\n    '
    const sortedCollisionTiles = Array.from(collisionTiles.value).sort((a, b) => a - b)
    
    for (let i = 0; i < sortedCollisionTiles.length; i++) {
        // User requested "ID (Tile + 128 offset)"
        const val = sortedCollisionTiles[i] + 128
        output += val + ','
    }
    output += '\n};\n'
    return output
}

const generateAnimationOutput = () => {
    if (animations.value.length === 0) return ''
    
    let output = '\n// Animation Structures\n// typedef struct { unsigned char count; unsigned char speed; unsigned char* frames; } TileAnim;\n'
    
    animations.value.forEach(anim => {
        const safeName = anim.name.replace(/\s+/g, '')
        output += `\nconst unsigned char ${safeName}Frames[] = { ${anim.frames.join(', ')} };`
        output += `\nconst struct { unsigned char count; unsigned char speed; const unsigned char* frames; } ${safeName} = { ${anim.frames.length}, ${anim.speed}, ${safeName}Frames };\n`
    })
    
    return output

}

const generateSpriteActorsOutput = () => {
    if (spriteActors.value.length === 0) return ''
    
    // 1. Generate Tile Data (Single Block)
    const safeTilesetName = tilesetName.value.replace(/\s+/g, '') + '_SpriteTiles'
    let output = `\n// Sprite Tile Data (16x16 frames, 4 tiles per frame)\n// Order: TL, BL, TR, BR (8x16 mode compatible)\nconst unsigned char ${safeTilesetName}[] = {\n`
    
    // 2. Prepare for MetaSprite Definitions
    let metaSpriteOutput = `\n\n// MetaSprite Definitions (metasprite_t)\n// Requires: #include <gb/metasprites.h>\n`
    
    let globalTileCount = 0
    
    spriteActors.value.forEach(actor => {
        const safeActorName = actor.name.replace(/\s+/g, '')
        const framePointers = []
        
        output += `    // ${actor.name}\n`
        metaSpriteOutput += `\n// ${actor.name} Frames\n`

        actor.frames.forEach((frame, frameIdx) => {
             const startTile = globalTileCount
             const frameName = `${safeActorName}_Frame${frameIdx}`
             framePointers.push(frameName)
             
             // -- Tile Data Gen --
             output += `    // Frame ${frameIdx} (Tiles ${startTile}-${startTile+3})\n`
            
            // Standard Grid:
            // 0: TL, 1: TR
            // 2: BL, 3: BR
            
            // We want output order: TL, BL, TR, BR
            // So we map:
            // Out 0 -> Grid 0 (TL)
            // Out 1 -> Grid 2 (BL)
            // Out 2 -> Grid 1 (TR)
            // Out 3 -> Grid 3 (BR)
            
            const tiles = [[], [], [], []]
            
            for(let y=0; y<16; y++) {
                for(let x=0; x<16; x++) {
                    const pixel = frame[y*16 + x]
                    let tileIdx = 0
                    if (y >= 8) tileIdx += 2 // Bottom
                    if (x >= 8) tileIdx += 1 // Right
                    tiles[tileIdx].push(pixel)
                }
            }
            
            // Reorder for export: TL (0), BL (2), TR (1), BR (3)
            const orderedTiles = [tiles[0], tiles[2], tiles[1], tiles[3]]
            
            orderedTiles.forEach((tilePixels, tIdx) => {
               const hexes = []
                for (let i = 0; i < 8; i++) {
                    const lsb = []
                    const msb = []
                    const rowPixels = tilePixels.slice(i*8, i*8+8)
                    rowPixels.forEach(p => {
                         if (p === 0) { lsb.push(0); msb.push(0) }
                         if (p === 1) { lsb.push(1); msb.push(0) }
                         if (p === 2) { lsb.push(0); msb.push(1) }
                         if (p === 3) { lsb.push(1); msb.push(1) }
                    })
                    let lsbHex = parseInt(lsb.join(''), 2).toString(16).toUpperCase()
                    lsbHex = (lsbHex.length === 1 ? '0x0' : '0x') + lsbHex
                    let msbHex = parseInt(msb.join(''), 2).toString(16).toUpperCase()
                    msbHex = (msbHex.length === 1 ? '0x0' : '0x') + msbHex
                    hexes.push(lsbHex)
                    hexes.push(msbHex)
                }
                output += '    ' + hexes.join(',') + ',\n'
            })
            
            // -- MetaSprite Struct Gen --
            // 8x16 Mode Composite logic
            // In 8x16 mode, a single hardware sprite displays two vertically adjacent 8x8 tiles.
            // The Tile Index usually points to the top one (must be even), and the bottom one is implicitly top+1.
            
            // However, typical metasprite libraries (like GBDK's) often use 8x8 sprites by default, 
            // OR handle 8x16 by expecting specific tile ordering.
            // But if we are defining explicit metasprites with offsets, we can just point to the tiles.
            
            // The request specifically asked for the DATA to be ordered for 8x16 hardware sprites (Vertical Columns).
            // TL, BL, TR, BR
            
            // If we use 8x16 sprites:
            // Sprite 1 (Left): Uses Tile [startTile] (which is TL) & [startTile+1] (which is BL)
            // Sprite 2 (Right): Uses Tile [startTile+2] (which is TR) & [startTile+3] (which is BR)
            
            // Metasprite struct for 8x16 mode (2 hardware sprites):
            metaSpriteOutput += `const metasprite_t ${frameName}[] = {\n`
            // Left Column (TL+BL)
            metaSpriteOutput += `    { 0, 0, ${startTile}, 0 },  // Left Column (Tiles ${startTile}, ${startTile+1})\n`
            // Right Column (TR+BR) -> x+8
            metaSpriteOutput += `    { 0, 8, ${startTile+2}, 0 },  // Right Column (Tiles ${startTile+2}, ${startTile+3})\n`
            metaSpriteOutput += `    { -128, 0, 0, 0 } // EOS\n`
            metaSpriteOutput += `};\n`
            
            globalTileCount += 4
        })
        
        // Animation Array
        metaSpriteOutput += `\nconst metasprite_t* ${safeActorName}_Anim[] = {\n    `
        metaSpriteOutput += framePointers.join(',\n    ')
        metaSpriteOutput += `\n};\n`
    })
    
    output += `};\n`
    
    return output + metaSpriteOutput
}



const copyToClipboard = () => {
    let output = ''
    if (mode.value === 'map') {
        output += generateOutput()
        output += '\n' + generateCollisionOutput()
        output += '\n' + generateAnimationOutput()
        alert("Copied MAP data to clipboard!")
    } else {
        output += generateSpriteActorsOutput()
        alert("Copied SPRITE data to clipboard!")
    }
    navigator.clipboard.writeText(output)
}

const saveFile = () => {
    if (mode.value === 'map') {
        const project = {
            type: 'map_project',
            name: tilesetName.value,
            sprites: allSprites.value, // Background Tiles
            maps: maps.value,
            collisionTiles: Array.from(collisionTiles.value),
            animations: animations.value // Tile Animations
        }
        window.api.send('saveFile', JSON.stringify(project, null, 2))
    } else {
         const project = {
            type: 'sprite_project',
            name: tilesetName.value, // Maybe separate name?
            spriteActors: spriteActors.value
        }
        window.api.send('saveFile', JSON.stringify(project, null, 2))
    }
}

const openFile = () => {
    window.api.send('openFile')
}

const mouseDown = ref(false)

window.api.receive("togglePalette", () => {
    const r = document.querySelector(':root')
    if (palette.value === 'bw') {
        palette.value = 'dmg'
        r.style.setProperty('--color-lightest', '224 248 208')
        r.style.setProperty('--color-light', '136 192 112')
        r.style.setProperty('--color-dark', '52 104 86')
        r.style.setProperty('--color-darkest', '8 24 32')
    } else {
        palette.value = 'bw'
        r.style.setProperty('--color-lightest', '255 255 255')
        r.style.setProperty('--color-light', '204 204 204')
        r.style.setProperty('--color-dark', '85 85 85')
        r.style.setProperty('--color-darkest', '0 0 0')
    }
});

window.api.receive("spritesLoaded", (data) => {
    console.log("spritesLoaded received data:", data)

    // Detect Project Type
    if (data.type === 'sprite_project' || (data.spriteActors && !data.sprites)) {
        // Sprite Load
        if (data.spriteActors) {
            spriteActors.value = data.spriteActors
        } else {
            spriteActors.value = []
            addActor()
        }
        mode.value = 'sprite'
        if (data.name) tilesetName.value = data.name
        alert("Loaded Sprite Project")
        return
    }

    // Default: Map Load
    mode.value = 'map'
    
    allSprites.value = []
    if (!data.sprites || data.sprites.length === 0) {
        console.log("No sprites found, adding default")
        addSprite()
    } else {
        console.log("Setting sprites:", data.sprites.length)
        allSprites.value = data.sprites
    }
    
    if (data.collisionTiles) {
        collisionTiles.value = new Set(data.collisionTiles)
    } else {
        collisionTiles.value = new Set()
    }

    if (data.animations) {
        animations.value = data.animations
    } else {
         animations.value = []
    }

    sprite.value = 0

    if (data.name) {
        tilesetName.value = data.name
    }

    if (data.maps && data.maps.length > 0) {
        console.log("Setting maps:", data.maps)
        maps.value = data.maps
    } else if (data.map) {
         // Legacy support or fallback
         console.log("Legacy map found")
         maps.value = [{
            name: 'Map 1',
            width: data.mapWidth || 12,
            height: data.mapHeight || 12,
            oldWidth: data.mapWidth || 12,
            oldHeight: data.mapHeight || 12,
            data: data.map
         }]
    } else {
        console.log("No maps found, creating default")
         maps.value = [{
            name: 'Map 1',
            width: 20,
            height: 18,
            oldWidth: 20,
            oldHeight: 18,
            data: Array(360).fill(0)
         }]

    }



    // Explicitly clear or ignore spriteActors for Map Project unless needed? 
    // Usually keep existing unless user explicitly loads sprites. 
    // But "dedicated" implies separation.
    
    /* 
    if (data.spriteActors) {
        spriteActors.value = data.spriteActors
    } else {
        spriteActors.value = []
        addActor() 
    }
    */
    
    currentMapIndex.value = 0
    console.log("Finished spritesLoaded")
    alert("Loaded Map Project")
});
</script>

<template>
    <div class="flex flex-col h-screen w-screen overflow-hidden bg-gray-100 font-sans" :key="palette">
        <!-- Top Header / Toolbar -->
        <div class="h-14 bg-white border-b border-gray-300 flex items-center px-4 gap-4 shrink-0 shadow-sm z-10">
            <h1 class="text-lg font-bold text-gray-700 hidden sm:block">Tile Tool</h1>
            
            <div class="h-8 w-px bg-gray-300 mx-2"></div>

            <div class="flex bg-gray-100 p-1 rounded-lg border border-gray-200">
                <button @click="mode = 'map'" :class="['px-3 py-1 text-sm font-medium rounded transition-colors', mode === 'map' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700']">Map</button>
                <button @click="mode = 'sprite'" :class="['px-3 py-1 text-sm font-medium rounded transition-colors', mode === 'sprite' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700']">Sprite</button>
            </div>
            
            <input v-model="tilesetName" class="bg-gray-100 border border-gray-300 px-3 py-1 rounded text-sm w-40 focus:outline-none focus:border-blue-500" placeholder="Project Name" />

            <div class="h-8 w-px bg-gray-300 mx-2"></div>

            <!-- Tools -->
            <div class="flex items-center bg-gray-100 p-1 rounded-lg border border-gray-200">
                <button @click="tool='pencil'" :class="['p-1.5 rounded transition-colors', tool === 'pencil' ? 'text-blue-600 bg-white shadow-sm' : 'text-gray-500 hover:text-gray-700']" title="Pencil">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512" fill="currentColor" class="w-5 h-5">
                        <path d="M339.3 367.1c27.3-3.9 51.9-19.4 67.2-42.9L568.2 74.1c12.6-19.5 9.4-45.3-7.6-61.2S517.7-4.4 499.1 9.6L262.4 187.2c-24 18-38.2 46.1-38.4 76.1L339.3 367.1zm-19.6 25.4l-116-104.4C143.9 290.3 96 339.6 96 400c0 3.9 .2 7.8 .6 11.6C98.4 429.1 86.4 448 68.8 448H64c-17.7 0-32 14.3-32 32s14.3 32 32 32H208c61.9 0 112-50.1 112-112c0-2.5-.1-5-.2-7.5z"/>
                    </svg>
                </button>
                <button @click="tool = 'fill'" :class="['p-1.5 rounded transition-colors', tool === 'fill' ? 'text-blue-600 bg-white shadow-sm' : 'text-gray-500 hover:text-gray-700']" title="Fill Bucket">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512" fill="currentColor" class="w-5 h-5">
                        <path d="M41.4 9.4C53.9-3.1 74.1-3.1 86.6 9.4L168 90.7l53.1-53.1c28.1-28.1 73.7-28.1 101.8 0L474.3 189.1c28.1 28.1 28.1 73.7 0 101.8L283.9 481.4c-37.5 37.5-98.3 37.5-135.8 0L30.6 363.9c-37.5-37.5-37.5-98.3 0-135.8L122.7 136 41.4 54.6c-12.5-12.5-12.5-32.8 0-45.3zm176 221.3L168 181.3 75.9 273.4c-4.2 4.2-7 9.3-8.4 14.6H386.7l42.3-42.3c3.1-3.1 3.1-8.2 0-11.3L277.7 82.9c-3.1-3.1-8.2-3.1-11.3 0L213.3 136l49.4 49.4c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0zM512 512c-35.3 0-64-28.7-64-64c0-25.2 32.6-79.6 51.2-108.7c6-9.4 19.5-9.4 25.5 0C543.4 368.4 576 422.8 576 448c0 35.3-28.7 64-64 64z"/>
                    </svg>
                </button>
                <button @click="tool = 'hand'" :class="['p-1.5 rounded transition-colors', tool === 'hand' ? 'text-blue-600 bg-white shadow-sm' : 'text-gray-500 hover:text-gray-700']" title="Hand Tool (Pan)">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="currentColor" class="w-5 h-5">
                       <path d="M288 32c0-17.7-14.3-32-32-32s-32 14.3-32 32V240c0 8.8-7.2 16-16 16s-16-7.2-16-16V64c0-17.7-14.3-32-32-32s-32 14.3-32 32V336c0 1.5 .1 3.1 .2 4.6l-17.6-6.8c-12.2-4.7-25.9-2.9-36.5 4.8s-16.5 20.3-15.8 33.4l6.5 120.2c5.6 103.5 90.5 185.8 194.1 185.8c107.5 0 194.6-87 194.6-194.6c0-43.2-13.7-83.3-36.9-116.1l-25.7-36.3c-1.3-1.8-15.1-19.8-37.9-19.8h-1.2c-15.9 0-29.6 11.1-32.5 26.8l-12.5 66.8V32z"/>
                    </svg>
                </button>
            </div>

            <label class="flex items-center gap-2 cursor-pointer select-none text-sm text-gray-600 hover:text-gray-800">
                 <input type="checkbox" id="showGrid" v-model="showGrid" class="rounded text-blue-500 focus:ring-blue-500"/>
                 <span>Show Grid</span>
            </label>

            <div class="h-8 w-px bg-gray-300 mx-2"></div>
            
            <div class="flex gap-2 ml-auto">
                <button @click="openFile" class="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-3 py-1.5 rounded text-sm font-medium shadow-sm transition-colors">Load {{ mode === 'map' ? 'Map' : 'Sprites' }}</button>
                <button @click="saveFile" class="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-3 py-1.5 rounded text-sm font-medium shadow-sm transition-colors">Save {{ mode === 'map' ? 'Map' : 'Sprites' }}</button>
                <button @click="copyToClipboard" class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-sm font-medium shadow-sm transition-colors">Export {{ mode === 'map' ? 'Map' : 'Sprites' }} C</button>
            </div>
        </div>

        <!-- Main Content -->
        <div class="flex flex-1 min-h-0">
            <!-- Left Sidebar: Tile Editor & Library (MAP MODE) -->
            <div v-if="mode === 'map'" class="w-[300px] shrink-0 bg-white border-r border-gray-300 flex flex-col min-h-0 z-0">
                <!-- Sidebar Tabs -->
                <div class="flex border-b border-gray-200">
                    <button @click="sidebarMode = 'editor'" :class="['flex-1 py-2 text-xs font-bold uppercase tracking-wide', sidebarMode === 'editor' ? 'bg-gray-50 text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700']">Editor</button>
                    <button @click="sidebarMode = 'anims'" :class="['flex-1 py-2 text-xs font-bold uppercase tracking-wide', sidebarMode === 'anims' ? 'bg-gray-50 text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700']">Animations</button>
                </div>

                <!-- Top: Pixel Editor (Visible only in editor mode) -->
                <div v-if="sidebarMode === 'editor'" class="p-4 border-b border-gray-200 bg-gray-50 flex flex-col items-center gap-4">
                     <!-- Copy/Paste Controls -->
                     <div class="flex gap-2 w-full justify-center mb-1">
                         <button @click="copyTile" class="text-xs bg-white border border-gray-300 px-2 py-1 rounded hover:bg-gray-100" title="Copy Tile">Copy</button>
                         <button @click="pasteTile" :disabled="!clipboardTile" class="text-xs bg-white border border-gray-300 px-2 py-1 rounded hover:bg-gray-100 disabled:opacity-50" title="Paste Tile">Paste</button>
                     </div>
                     
                     <!-- Editor Grid -->
                     <div @mouseleave="() => mouseDown = false" class="w-[203px] h-[203px] grid grid-rows-[repeat(8,_24px)] grid-cols-[repeat(8,_24px)] bg-gray-200 border-2 border-gray-300 shadow-sm gap-px select-none cursor-crosshair">
                        <div
                            v-for="i in 64"
                            :class="colors[allSprites[sprite][i-1]]"
                            @mousedown="() => {colorPixel(i-1); mouseDown = true}"
                            @mouseup="() => mouseDown = false"
                            @mouseover="() => mouseDown && colorPixel(i-1)"
                        ></div>
                    </div>
                    
                    <!-- Color Palette -->
                    <div class="flex border-2 border-gray-300 rounded overflow-hidden shadow-sm">
                        <div @click="color = 0" :class="[color === 0 ? 'ring-2 ring-blue-500 ring-inset z-10' : '', 'w-8 h-8 flex items-center justify-center cursor-pointer hover:opacity-90 transition-all', colors[0]]">0</div>
                        <div @click="color = 1" :class="[color === 1 ? 'ring-2 ring-blue-500 ring-inset z-10' : '', 'w-8 h-8 flex items-center justify-center cursor-pointer hover:opacity-90 transition-all', colors[1]]">1</div>
                        <div @click="color = 2" :class="[color === 2 ? 'ring-2 ring-blue-500 ring-inset z-10' : '', 'w-8 h-8 flex items-center justify-center text-white cursor-pointer hover:opacity-90 transition-all', colors[2]]">2</div>
                        <div @click="color = 3" :class="[color === 3 ? 'ring-2 ring-blue-500 ring-inset z-10' : '', 'w-8 h-8 flex items-center justify-center text-white cursor-pointer hover:opacity-90 transition-all', colors[3]]">3</div>
                    </div>
                </div>

                <!-- Top: Animation Editor (Visible only in anims mode) -->
                <div v-if="sidebarMode === 'anims'" class="p-4 border-b border-gray-200 bg-gray-50 flex flex-col gap-4 h-[300px]">
                    <!-- Anim List -->
                    <div class="flex items-center gap-2">
                         <select v-model="activeAnimIndex" class="flex-1 bg-white border border-gray-300 rounded px-2 py-1 text-sm">
                             <option v-for="(anim, i) in animations" :key="i" :value="i">{{ anim.name }}</option>
                         </select>
                         <button @click="addAnim" class="bg-blue-500 text-white px-2 py-1 rounded text-sm hover:bg-blue-600">+</button>
                         <button @click="removeAnim(activeAnimIndex)" class="bg-red-500 text-white px-2 py-1 rounded text-sm hover:bg-red-600" :disabled="animations.length === 0">-</button>
                    </div>

                    <div v-if="animations.length > 0" class="flex flex-col gap-3">
                        <div class="flex gap-2">
                             <input v-model="animations[activeAnimIndex].name" class="flex-1 border bg-white rounded px-2 py-1 text-sm" placeholder="Anim Name" />
                             <input type="number" v-model="animations[activeAnimIndex].speed" class="w-16 border bg-white rounded px-2 py-1 text-sm" placeholder="Spd" title="Speed (frames)" />
                        </div>
                        
                        <div class="text-xs font-bold text-gray-500 uppercase">Frames</div>
                        <div class="flex-1 bg-white border border-gray-200 p-2 rounded overflow-y-auto h-[120px] flex flex-wrap content-start gap-1">
                             <div v-for="(frame, idx) in animations[activeAnimIndex].frames" :key="idx" class="relative group border border-gray-200 w-8 h-8">
                                 <SpriteRender :sprite="allSprites[frame]" />
                                 <button @click="removeFrame(idx)" class="absolute -top-1 -right-1 bg-red-500 text-white w-3 h-3 rounded-full flex items-center justify-center text-[8px] opacity-0 group-hover:opacity-100 hover:bg-red-700">x</button>
                             </div>
                             <div v-if="animations[activeAnimIndex].frames.length === 0" class="text-xs text-gray-400 p-2">No frames added</div>
                        </div>

                        <button @click="addFrame" class="bg-green-600 text-white w-full py-1.5 rounded text-sm hover:bg-green-700 shadow-sm transition-colors flex items-center justify-center gap-2">
                             <span>+ Add Current Tile (#{{sprite}})</span>
                             <div class="w-4 h-4 border border-white/50"><SpriteRender :sprite="allSprites[sprite]" /></div>
                        </button>
                    </div>
                    <div v-else class="text-center text-sm text-gray-500 mt-10">
                        Create an animation to start.
                    </div>
                </div>

                <!-- Bottom: Tile Library -->
                <div class="flex-1 flex flex-col min-h-0 bg-white">
                    <div class="px-4 py-2 bg-gray-100 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wide flex justify-between items-center">
                        <span>Tile Library</span>
                        <span class="bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded text-[10px]">{{allSprites.length}}</span>
                    </div>
                    <div class="p-2 overflow-y-auto flex-1 content-start flex flex-wrap gap-1">
                        <div v-for="(s, index) in allSprites" :key="index" class="relative group">
                            <div 
                                @click="sprite = index"
                                :class="['border-2 cursor-pointer transition-all', index === sprite ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200 hover:border-gray-400']"
                            >
                                <SpriteRender :sprite="s" />
                            </div>
                            <!-- Tooltip for index -->
                            <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-1.5 py-0.5 bg-black text-white text-[10px] rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-10">
                                #{{ index }}
                            </div>
                            <!-- Collision Indicator / Toggle -->
                            <div 
                                @click.stop="toggleCollision(index)"
                                :class="['absolute top-0 right-0 w-3 h-3 m-0.5 rounded-full border border-white cursor-pointer z-50 hover:scale-110 shadow-sm', collisionTiles.has(index) ? 'bg-red-500' : 'bg-gray-300 opacity-0 group-hover:opacity-50']"
                                title="Toggle Collision"
                            ></div>
                        </div>
                        
                         <!-- Add Button -->
                        <button @click="addSprite" class="w-[28px] h-[28px] flex items-center justify-center border-2 border-dashed border-gray-300 text-gray-400 hover:text-blue-500 hover:border-blue-500 hover:bg-blue-50 rounded transition-colors" title="Add New Tile">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" fill="currentColor" class="w-4 h-4"><path d="M256 80c0-17.7-14.3-32-32-32s-32 14.3-32 32V224H48c-17.7 0-32 14.3-32 32s14.3 32 32 32H192V432c0 17.7 14.3 32 32 32s32-14.3 32-32V288H400c17.7 0 32-14.3 32-32s-14.3-32-32-32H256V80z"/></svg>
                        </button>
                    </div>
                </div>
            </div>

            <!-- Right Area: Maps (MAP MODE) -->
            <div v-if="mode === 'map'" class="flex-1 flex flex-col min-w-0 bg-gray-200">
                <!-- Map Header (Tabs + Details) -->
                <div class="bg-white border-b border-gray-300 shadow-sm shrink-0 pl-2">
                    <!-- Tabs -->
                    <div class="flex items-center gap-1 overflow-x-auto pt-2 pb-0 scrollbar-hide">
                         <button 
                            v-for="(m, i) in maps" 
                            :key="i"
                            @click="currentMapIndex = i"
                            :class="['px-3 py-1.5 text-sm font-medium rounded-t-lg border-t border-x transition-colors whitespace-nowrap relative top-px', currentMapIndex === i ? 'bg-gray-100 border-gray-300 text-blue-600 z-10' : 'bg-gray-50 border-transparent text-gray-500 hover:bg-gray-100']"
                        >
                            {{ m.name }}
                        </button>
                        <button @click="addMap" class="ml-1 p-1 text-gray-400 hover:text-blue-600 transition-colors" title="New Map">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" fill="currentColor" class="w-4 h-4"><path d="M256 80c0-17.7-14.3-32-32-32s-32 14.3-32 32V224H48c-17.7 0-32 14.3-32 32s14.3 32 32 32H192V432c0 17.7 14.3 32 32 32s32-14.3 32-32V288H400c17.7 0 32-14.3 32-32s-14.3-32-32-32H256V80z"/></svg>
                        </button>
                    </div>
                </div>
                
                <!-- Map Controls Bar -->
                <div class="h-10 bg-gray-100 border-b border-gray-200 flex items-center px-4 gap-4 shrink-0 text-sm">
                    <div class="flex items-center gap-2">
                        <span class="text-gray-500 font-medium">Map Name:</span>
                        <input v-model="currentMap.name" class="bg-white border border-gray-300 px-2 py-0.5 rounded w-32 focus:outline-none focus:border-blue-500" />
                    </div>
                    <div class="h-4 w-px bg-gray-300"></div>
                     <div class="flex items-center gap-2">
                        <span class="text-gray-500 font-medium">Size:</span>
                        <input type="number" class="bg-white border border-gray-300 px-1 py-0.5 rounded w-14 text-center focus:outline-none focus:border-blue-500" v-model="currentMap.width" @change="adjustMap" />
                        <span class="text-gray-400">x</span>
                        <input type="number" class="bg-white border border-gray-300 px-1 py-0.5 rounded w-14 text-center focus:outline-none focus:border-blue-500" v-model="currentMap.height" @change="adjustMap" />
                    </div>
                    <div class="ml-auto">
                        <button @click="removeMap(currentMapIndex)" class="text-red-500 hover:text-red-700 font-medium flex items-center gap-1 text-xs uppercase tracking-wide">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" fill="currentColor" class="w-3 h-3"><path d="M135.2 17.7L128 32H32C14.3 32 0 46.3 0 64S14.3 96 32 96H416c17.7 0 32-14.3 32-32s-14.3-32-32-32H320l-7.2-14.3C307.4 6.8 296.3 0 284.2 0H163.8c-12.1 0-23.2 6.8-28.6 17.7zM416 128H32L53.2 467c1.6 25.3 22.6 45 47.9 45H346.9c25.3 0 46.3-19.7 47.9-45L416 128z"/></svg>
                            Delete Map
                        </button>
                    </div>
                </div>

                <!-- Map Viewport -->
                <div class="flex-1 relative overflow-hidden bg-gray-300 shadow-inner">
                    <MapRender
                        :map="currentMap.data"
                        :mapWidth="currentMap.width"
                        :mapHeight="currentMap.height"
                        :sprites="allSprites"
                        :showGrid="showGrid"
                        :tool="tool"

                        @paint="colorMap"
                    />
                </div>
            </div>

            <!-- SPRITE MODE UI -->
             
            <!-- Left Sidebar: Sprite List -->
            <div v-if="mode === 'sprite'" class="w-[200px] shrink-0 bg-white border-r border-gray-300 flex flex-col min-h-0 z-0">
                 <div class="px-4 py-2 bg-gray-100 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wide flex justify-between items-center">
                    <span>Sprites</span>
                    <button @click="addActor" class="text-blue-600 hover:text-blue-800 font-bold">+</button>
                </div>
                <div class="flex-1 overflow-y-auto p-2 flex flex-col gap-1">
                    <div v-for="(actor, idx) in spriteActors" :key="idx" 
                        @click="activeActorIndex = idx; activeFrameIndex = 0"
                        :class="['flex items-center gap-2 p-1 rounded cursor-pointer border', activeActorIndex === idx ? 'bg-blue-50 border-blue-500' : 'border-transparent hover:bg-gray-50']"
                    >
                        <div class="w-8 h-8 border border-gray-200 bg-gray-100 shrink-0">
                            <!-- Preview first frame -->
                             <MetaSpriteRender v-if="actor.frames[0]" :data="actor.frames[0]" :scale="2" />
                        </div>
                        <div class="truncate text-sm font-medium text-gray-700">{{ actor.name }}</div>
                    </div>
                </div>
            </div>

            <!-- Right Area: Sprite Editor -->
             <div v-if="mode === 'sprite' && activeActor" class="flex-1 flex flex-col min-w-0 bg-gray-100">
                <!-- Toolbar -->
                <div class="h-12 bg-white border-b border-gray-300 flex items-center px-4 gap-4 shrink-0 shadow-sm">
                    <input v-model="activeActor.name" class="bg-gray-100 border border-gray-300 px-3 py-1 rounded text-sm font-bold w-48 focus:outline-none focus:border-blue-500" />
                    
                    <div class="h-6 w-px bg-gray-300 mx-2"></div>
                    
                    <button @click="removeActor(activeActorIndex)" class="text-red-500 hover:text-red-700 text-sm flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" fill="currentColor" class="w-3 h-3"><path d="M135.2 17.7L128 32H32C14.3 32 0 46.3 0 64S14.3 96 32 96H416c17.7 0 32-14.3 32-32s-14.3-32-32-32H320l-7.2-14.3C307.4 6.8 296.3 0 284.2 0H163.8c-12.1 0-23.2 6.8-28.6 17.7zM416 128H32L53.2 467c1.6 25.3 22.6 45 47.9 45H346.9c25.3 0 46.3-19.7 47.9-45L416 128z"/></svg>
                        Delete Sprite
                    </button>
                </div>

                <!-- Editor Area -->
                <div class="flex-1 flex overflow-hidden">
                    <!-- Main Editor & Palette -->
                    <div class="flex-1 flex flex-col items-center justify-center p-8 bg-gray-200 relative overflow-auto">
                        
                         <!-- 16x16 Editor Grid -->
                        <div class="flex flex-col gap-4 items-center">
                            <div @mouseleave="() => mouseDown = false" class="grid grid-rows-[repeat(16,_24px)] grid-cols-[repeat(16,_24px)] bg-gray-300 border-2 border-gray-400 shadow-xl gap-px select-none cursor-crosshair">
                                <div
                                    v-for="i in 256"
                                    :class="colors[activeFrame[i-1]]"
                                    @mousedown="() => {colorActorPixel(i-1); mouseDown = true}"
                                    @mouseup="() => mouseDown = false"
                                    @mouseover="() => mouseDown && colorActorPixel(i-1)"
                                ></div>
                            </div>

                            <!-- Palette (Shared) -->
                             <div class="flex border-2 border-gray-400 rounded overflow-hidden shadow-sm bg-white">
                                <div @click="color = 0" :class="[color === 0 ? 'ring-2 ring-blue-500 ring-inset z-10' : '', 'w-10 h-10 flex items-center justify-center cursor-pointer hover:opacity-90 transition-all', colors[0]]">0</div>
                                <div @click="color = 1" :class="[color === 1 ? 'ring-2 ring-blue-500 ring-inset z-10' : '', 'w-10 h-10 flex items-center justify-center cursor-pointer hover:opacity-90 transition-all', colors[1]]">1</div>
                                <div @click="color = 2" :class="[color === 2 ? 'ring-2 ring-blue-500 ring-inset z-10' : '', 'w-10 h-10 flex items-center justify-center text-white cursor-pointer hover:opacity-90 transition-all', colors[2]]">2</div>
                                <div @click="color = 3" :class="[color === 3 ? 'ring-2 ring-blue-500 ring-inset z-10' : '', 'w-10 h-10 flex items-center justify-center text-white cursor-pointer hover:opacity-90 transition-all', colors[3]]">3</div>
                            </div>
                        </div>

                    </div>
                </div>

                <!-- Footer: Timeline / Frames -->
                <div class="h-40 bg-white border-t border-gray-300 flex flex-col shrink-0">
                    <div class="px-4 py-2 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                        <span class="text-xs font-bold text-gray-500 uppercase">Frames ({{ activeActor.frames.length }})</span>
                        <div class="flex gap-2">
                             <button @click="copyActorFrame" class="text-xs bg-white border border-gray-300 px-2 py-1 rounded hover:bg-gray-50">Copy</button>
                             <button @click="pasteActorFrame" :disabled="!clipboardFrame" class="text-xs bg-white border border-gray-300 px-2 py-1 rounded hover:bg-gray-50 disabled:opacity-50">Paste</button>
                             <div class="h-4 w-px bg-gray-300 my-auto"></div>
                             <button @click="duplicateActorFrame" class="text-xs bg-white border border-gray-300 px-2 py-1 rounded hover:bg-gray-50">Duplicate</button>
                             <button @click="addActorFrame" class="text-xs bg-blue-600 text-white border border-blue-600 px-2 py-1 rounded hover:bg-blue-700">+ New Frame</button>
                        </div>
                    </div>
                    <div class="flex-1 overflow-x-auto p-4 flex gap-4 items-center">
                        <div 
                            v-for="(frame, fIdx) in activeActor.frames" 
                            :key="fIdx"
                            @click="activeFrameIndex = fIdx"
                            :class="['relative group border-2 p-1 cursor-pointer transition-all shrink-0 bg-gray-100', activeFrameIndex === fIdx ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300']"
                        >
                            <div class="w-16 h-16">
                                <MetaSpriteRender :data="frame" :scale="4" />
                            </div>
                            <div class="absolute top-1 left-2 text-[10px] text-gray-500 font-mono">{{ fIdx + 1 }}</div>
                             <button @click.stop="removeActorFrame(fIdx)" class="absolute -top-2 -right-2 bg-red-500 text-white w-4 h-4 rounded-full flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 shadow-sm hover:bg-red-700" title="Delete Frame">x</button>
                        </div>
                    </div>
                </div>

             </div>
        </div>
    </div>
</template>