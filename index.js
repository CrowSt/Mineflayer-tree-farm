const mineflayer = require('mineflayer')
const Vec3 = require('vec3')
const { Block } = require('prismarine-block')


const bot = mineflayer.createBot({
  host: '2b2t.org',
  username: 'CrowTheBest',
  auth: 'microsoft',
  // port: 25565, 
  //version: '1.21',
  // password: '12345678'
})


bot.on('physicTick', async () => {
  if (tick < 20) {
    tick += 1
    return  // wait 1 second after spawn to load everything
  }

  // wait for ZenithProxy (doesn't matter if not used)
  if (bot.player == undefined) return


  // looking for saplings and bone meal in inventory
  bone_meal = bot.inventory.slots.find(item => item != null && item.name.includes('bone_meal'))
  saplings = bot.inventory.slots.find(item => item != null && item.name.includes('sapling'))

  current_hand = bot.inventory.slots[bot.quickBarSlot]
  current_offhand = bot.inventory.slots[45]

  // looking for a dirt block, it should be on the same level as player's feet (not the block UNDER their feet)
  const blocks = bot.findBlocks({ matching: bot.registry.blocksByName['dirt'].id, maxDistance: 5, count: 1 })
  if (blocks) {
    for (let block in blocks) {
      if (blocks[block].y === bot.player.entity.position.y) {
        dirt = bot.blockAt(blocks[block])
        dirt_above = bot.blockAt(new Vec3(dirt.position.x, dirt.position.y + 1, dirt.position.z))
        break
      }
    }
  }

  // if we have bone meal and saplings, then start the farm
  if ((bone_meal != undefined && saplings != undefined)) {
    if (!current_hand) await bot.equip(bone_meal, 'hand')
    if (!current_offhand) await bot.equip(saplings, 'off-hand')

    // if a dirt block does exist
    if (dirt) {
      // then we search a lever, which coordinates are hardcoded as relative to the dirt block. They can be different on different tree farms
      lever = bot.blockAt(new Vec3(dirt.position.x + 10, dirt.position.y + 1, dirt.position.z))
      if (lever._properties.powered === true) { // включаем ферму
        await bot.activateBlock(bot.blockAt(new Vec3(dirt.position.x + 10, dirt.position.y + 1, dirt.position.z)))
        return // start the farm and left this tick
        // it could take several ticks to the server to register fucking packets

        // оставлю оригинальную строку, пожалуй. В ней есть душа!
        // может потребоваться несколько тиков для регистрации блядских пакетов сервером. Это одна из причин, почему я майнфлеер в рот ебал
      }

      // if there's nothing above dirt block, then place a sapling 
      if (dirt_above.name.includes('air')) {
        await bot._placeBlockWithOptions(dirt, new Vec3(0, 1, 0), { offhand: true, swingArm: true })
      }

      // but if there's a sampling, grow it!
      if (dirt_above.name.includes('sapling')) {
        await bot.activateBlock(dirt_above)
      }
    }
  }

  // if we have neither saplings or bone meal, then off the farm
  else {
    // check if dirt block exists
    if (dirt) {
      lever = bot.blockAt(new Vec3(dirt.position.x + 10, dirt.position.y + 1, dirt.position.z))
      // and if the lever exists
      if (lever.name.includes('lever')) {
        // then off the farm, if it doesn't
        if (lever._properties.powered === false) await bot.activateBlock(bot.blockAt(new Vec3(dirt.position.x + 10, dirt.position.y + 1, dirt.position.z)))
        return
      }
    }
  }
}
)


// Log errors and kick reasons
bot.on('kicked', console.log)
bot.on('error', console.log)
