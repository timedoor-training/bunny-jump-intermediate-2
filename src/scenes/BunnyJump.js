import Phaser from 'phaser'
import Carrot from '../game/Carrot'


var platforms
var player
var carrots
var carrotCollected = 0


export default class BunnyJumpScene extends Phaser.Scene {
    constructor() {
        super('bunny-jump-scene')
    }
    preload() {
        //upload gambar
        this.load.image('background', 'images/bg_layer1.png')
        this.load.image('platform', 'images/ground_grass.png')
        this.load.image('carrot', 'images/carrot.png')
        this.load.image('bunny_jump', 'images/bunny1_jump.png')
        this.load.image('bunny_stand', 'images/bunny1_stand.png')

        //upload sound
        this.load.audio('jumpSound', 'sfx/phaseJump1.ogg')
    }
    create() {
        this.carrotsCollected = 0

        this.add.image(240, 320, 'background').setScrollFactor(1, 0)
        //static physics group
        this.platforms = this.physics.add.staticGroup()

        //create many platform
        for (let i = 0; i < 5; i++) {
            const x = Phaser.Math.Between(80, 400)
            const y = 150 * i
            const platformChild = this.platforms.create(x, y, 'platform')
            platformChild.setScale(0.5)
            platformChild.refreshBody()
            const body = platformChild.body
            body.updateFromGameObject()
        }

        //create a player
        this.player = this.physics.add.sprite(240, 320, 'bunny_stand').setScale(0.5)

        //create carrot
        this.carrots = this.physics.add.group({
            classType: Carrot,
        })

        //add collider
        this.physics.add.collider(this.player, this.platforms)
        this.physics.add.collider(this.platforms, this.carrots)

        //turnof collider
        this.player.body.checkCollision.up = false
        this.player.body.checkCollision.left = false
        this.player.body.checkCollision.right = false

        //add camera following player
        this.cameras.main.startFollow(this.player)

        //create cursor
        this.cursors = this.input.keyboard.createCursorKeys()

        //deadzone
        this.cameras.main.setDeadzone(this.scale.width * 1.5)

        //overlap carrot and bunny
        this.physics.add.overlap(
            this.player,
            this.carrots,
            this.handleCollectCarrot,
            undefined,
            this
        )

        //create score text
        const style = { color: '#000', fontSize: 24 }
        this.carrotsCollectedText = this.add.text(240, 10, 'Carrots: 0', style)
            .setScrollFactor(0)
            .setOrigin(0.5, 0)







    }
    update() {

        const touchingDown = this.player.body.touching.down

        if (touchingDown) {
            this.player.setVelocityY(-300)
            this.player.setTexture('bunny_jump')
        }

        const vy = this.player.body.velocity.y
        if (vy > 0 && this.player.texture.key !== 'bunny_stand') {
            this.player.setTexture('bunny_stand')
        }

        //use cursor
        if (this.cursors.left.isDown && !touchingDown) {
            this.player.setVelocityX(-200)
        } else if (this.cursors.right.isDown && !touchingDown) {
            this.player.setVelocityX(200)
        } else {
            this.player.setVelocityX(0)
        }

        //parent child iteration
        this.platforms.children.iterate(child => {
            const platformChild = child
            const scrollY = this.cameras.main.scrollY
            if (platformChild.y >= scrollY + 700) {
                platformChild.y = scrollY - Phaser.Math.Between(50, 100)
                platformChild.body.updateFromGameObject()


                this.addCarrotAbove(platformChild)
            }
        })

        this.horizontalWrap(this.player)

        const bottomPlatform = this.findBottomMostPlatform()
        if (this.player.y > bottomPlatform.y + 500) {
            this.scene.start('game-over-scene')
        }

        //add sound
        if (touchingDown) {
            this.player.setVelocityY(-300)
            this.player.setTexture('bunny_jump')
            this.sound.play('jumpSound')
        }

    }
    // buat method dengan parameter sprite
    horizontalWrap(sprite) {
        const halfWidth = sprite.displayWidth * 0.5
        const gameWidth = this.scale.width
        if (sprite.x < -halfWidth) {
            sprite.x = gameWidth + halfWidth
        } else if (sprite.x > gameWidth + halfWidth) {
            sprite.x = -halfWidth
        }
    }

    //method exsisting untuk menambahkan fisik dari game object
    addCarrotAbove(sprite) {
        const y = sprite.y - sprite.displayHeight
        const carrot = this.carrots.get(sprite.x, y, 'carrot')

        carrot.setActive(true)
        carrot.setVisible(true)


        //menambahkan fisik dari carrot
        this.add.existing(carrot)
        carrot.body.setSize(carrot.width, carrot.height)

        this.physics.world.enable(carrot)

        return carrot
    }

    handleCollectCarrot(player, carrot) {
        this.carrots.killAndHide(carrot)
        this.physics.world.disableBody(carrot.body)

        this.carrotsCollected++

        const value = `Carrots: ${this.carrotsCollected}`
        this.carrotsCollectedText.text = value
    }

    findBottomMostPlatform() {
        const platforms = this.platforms.getChildren()

        let bottomPlatform = platforms[0]

        for (let i = 1; i < platforms.length; i++) {
            const platform = platforms[i]

            if (platform.y < bottomPlatform.y) {
                continue
            }
            bottomPlatform = platform
        }
        return bottomPlatform
    }
}