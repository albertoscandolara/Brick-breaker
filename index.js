const PX = "px";
const arrowLeft = "ArrowLeft";
const arrowRight = "ArrowRight";
const spaceBar = "Space";

const gameArea = document.querySelector(".game-area");
const gameAreaBoundingClientRect = gameArea.getBoundingClientRect();
const gameAreaLeftMargin = gameAreaBoundingClientRect.left;
const gameAreaRightMargin = gameAreaBoundingClientRect.right;
const gameAreaTopMargin = gameAreaBoundingClientRect.top;
const gameAreaBottomMargin = gameAreaBoundingClientRect.bottom;

let moveBallInterval = null;
let speedUpBallInterval = null;

const getRandom = (min, max, excludedValues = []) => {
  // min and max included
  let random = Math.random() * (max - min + 1) + min;
  return excludedValues.includes(random)
    ? getRandom(min, max, excludedValues)
    : random;
};

const resetGame = () => {
  window.clearInterval(moveBallInterval);
  window.clearInterval(speedUpBallInterval);
  paddle.init();
  ball.init();
};

// Define paddle object
let paddle = {
  DOMElement: null,
  width: 0,
  height: 0,
  left: 0,
  singleMove: 20,

  renderMove() {
    if (this.DOMElement) {
      this.DOMElement.style.left = this.left + PX;
    }
  },

  onKeyDownLeft() {
    // if left = 0 => do nothing
    if (this.left == 0) return;

    // Compute left
    this.left -= this.singleMove;

    // if left <0, make it 0
    if (this.left < 0) this.left = 0;
    this.renderMove();
  },

  onKeyDownRight() {
    // if left + width = gameAreaRightMargin - gameAreaLeftMargin => do nothing
    if (this.left + this.width == gameAreaRightMargin - gameAreaLeftMargin)
      return;

    // Compute left
    this.left += this.singleMove;

    // if left > gameAreaRightMargin, make it gameAreaRightMargin
    if (this.left + this.width > gameAreaRightMargin - gameAreaLeftMargin)
      this.left = gameAreaRightMargin - gameAreaLeftMargin - 2 - this.width; // 2 is to avoid overlapping for the 2px game-area border
    this.renderMove();
  },

  launchBall() {
    moveBallInterval = window.setInterval(ball.moveBall.bind(ball), 50);
    speedUpBallInterval = window.setInterval(ball.speedUpBall.bind(ball), 3000);
  },

  init() {
    this.DOMElement = document.querySelector("#paddle");
    if (this.DOMElement) {
      let paddleBoundingClientRect = this.DOMElement.getBoundingClientRect();
      this.width = paddleBoundingClientRect.width;
      this.height = paddleBoundingClientRect.height;
      this.left = gameAreaBoundingClientRect.width / 2 - this.width / 2;
      this.renderMove();
    }
  },
};

paddle.init();

// Define ball object
let ball = {
  DOMElement: null,
  bounceSound: new Audio(),
  looseSound: new Audio(),
  radius: 0,
  position: {
    left: 0,
    top: 0,
  },
  speed: {
    x: 10,
    y: 10,
  },
  angle: {
    sin: 0,
    cos: 0,
  },
  increaseSpeedValue: 2,

  renderMove() {
    if (this.DOMElement) {
      this.DOMElement.style.left = this.position.left + PX;
      this.DOMElement.style.top = this.position.top + PX;
    }
  },

  moveBall() {
    this.position.left += this.speed.x * this.angle.cos;
    this.position.top += -this.speed.y * this.angle.sin;
    this.renderMove();
  },

  speedUpBall() {
    this.speed.x += this.increaseSpeedValue;
    this.speed.y += this.increaseSpeedValue;
  },

  init() {
    this.DOMElement = document.querySelector(".ball");
    if (this.DOMElement) {
      // Set bounce sound
      this.bounceSound.src = "./assets/sounds/boing.wav";
      this.looseSound.src = "./assets/sounds/loose.wav";

      // Set random sin and cos
      this.angle = {
        sin: getRandom(0.866, 1, [1]),
        cos: getRandom(-0.5, 0.5, [0]),
      };

      this.speed = {
        x: 10,
        y: 10,
      };

      let ballBoundingClientRect = this.DOMElement.getBoundingClientRect();
      this.radius = ballBoundingClientRect.width / 2;
      this.position.left = gameAreaBoundingClientRect.width / 2 - this.radius;
      this.position.top =
        gameAreaBoundingClientRect.height - paddle.height - this.radius * 2;
      this.renderMove();
    }
  },

  // Ball object is also responsible for interaction with game area, bricks and paddle
  manageCollision(entries, observer) {
    if (entries) {
      let ball = this;
      if (ball) {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            if (
              entry.intersectionRect.right >= gameAreaRightMargin ||
              entry.intersectionRect.left <= gameAreaLeftMargin
            ) {
              // Left or right border collision
              ball.speed.x = ball.speed.x * -1;
              ball.bounceSound.play();
            } else if (entry.intersectionRect.top <= gameAreaTopMargin) {
              // Top border collision
              ball.speed.y = ball.speed.y * -1;
              ball.bounceSound.play();
            } else if (entry.intersectionRect.bottom >= gameAreaBottomMargin) {
              // Bottom border collision - GAME OVER
              ball.looseSound.play();

              // Reset after timeout to let loose sound time to play
              window.setTimeout(() => {
                resetGame();
              }, 1000);
            }
          }
        });
      }
    }
  },
};

ball.init();

// Define the brick object

// Create multiple bricks

// Set left and right arrows event listener
document.addEventListener("keydown", function (e) {
  switch (e.code) {
    case arrowLeft:
      paddle.onKeyDownLeft();
      break;
    case arrowRight:
      paddle.onKeyDownRight();
      break;
    case spaceBar:
      paddle.launchBall();
      break;
  }
});

// Initialize observers to detect collisions
// The game area includes the ball, therefore collide with game area limits means we don't have a full intersection anymore
// On the contrary, collisions with bricks and paddle happen when an intersection happpens between the ball and another object

// Define observers
let optionsPaddle = {
  root: paddle.DOMElement,
  rootMargin: "0px",
  threshold: 0,
};

let paddleCollisionObserver = new IntersectionObserver(
  ball.manageCollision,
  optionsPaddle
);

// Observe collisions with paddle
paddleCollisionObserver.observe(ball.DOMElement);

//   let optionsBricks = {
//     root: bricks.DOMElement,
//     rootMargin: "0px",
//     threshold: 0,
//   };

//   let bricksCollisionObserver = new IntersectionObserver(
//     ball.manageCollision,
//     optionsBricks
//   );

// Observe collisions with bricks
// bricksCollisionObserver.observe(ball.DOMElement);

let optionsGameAreaLimits = {
  root: gameArea,
  rootMargin: "1px",
  threshold: 1,
};

let gameAreaLimitsCollisionObserver = new IntersectionObserver(
  ball.manageCollision.bind(ball),
  optionsGameAreaLimits
);

// Observe collisions with game area limits
gameAreaLimitsCollisionObserver.observe(ball.DOMElement);
