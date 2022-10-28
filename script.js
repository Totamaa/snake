// jshint browser:true, eqeqeq:true, undef:true, devel:true, esversion: 9

(function()
{
	// JSON
	const JSON_FILE = "save.json";
	
	// ELT DOM
	const BUTTONPLAY = document.getElementById("playButton");
	const INPUTCOLOR = document.getElementById("colorSnake");
	const CANVAS = document.getElementById("boardGame");
	const GAMEDIV = document.getElementById("boardDiv");
	const PARADIV = document.getElementById("paraDiv");
	const BESTSCORE = document.getElementById("bestScore");
	const SCORE = document.getElementById("score");
	const LASTSCORE = document.getElementById("lastScore");
	const BONUSMALUS = document.getElementById("bonusMalus");

	// IMG
	const IMGAPPLE = new Image();
	IMGAPPLE.src = "assets/apple.png";
	const IMGMUSHROOM = new Image();
	IMGMUSHROOM.src = "assets/mushroom.png";
	const IMGPICKAXE = new Image();
	IMGPICKAXE.src = "assets/pickaxe.png";
	const IMGSNAIL = new Image();
	IMGSNAIL.src = "assets/slow.png";
	const IMGWALL = new Image();
	IMGWALL.src = "assets/wall.png";

	// MAP
	const CASESIDE = 20; // size of one case in px
	const EMPTY = 0;
	const SNAKE = 1;
	const APPLE = 2;
	const WALL = 3;
	const MUSHROOM = 4;
	const PICKAXE = 5;
	const SNAIL = 6;
	let world; // map of the world
	let sizeGrid;
	let ctx;
	let nbBeforeChangeMax;
	let nbBeforeChange;
	let tabWall;
	
	// SNAKE
	let snakeBody; // tab of snake position
	let snakeDirection; // direction vecteur of the snake
	let tempDirection; // to avoid snake going back on itself
	let snakeSpeed;
	let nbSnakeSlow;
	
	// COLOR
	const RED = "#FF0000";
	const GREY = "#555555";
	const WHITE = "#FFFFFF";
	const LIGHTGREY = "#CCCCCC";
	const YELLOWGREEN = "#ADBF24";
	const GREEN = "#76b42d";

	// score
	let scoreValue = 0;
	if (localStorage.getItem("bestScore"))
	{
		BESTSCORE.textContent = localStorage.getItem("bestScore");
	}
	else
	{
		BESTSCORE.textContent = 0;
	}
	
	// play
	let intervalId;
	BUTTONPLAY.addEventListener("click", play);
	
	/**
	 * function call when we want to play
	 */
	function play()
	{
		// change the visibility
		ctx = CANVAS.getContext('2d');
		GAMEDIV.classList.toggle("hidden");
		PARADIV.classList.toggle("hidden");

		// init snake direction
		snakeDirection = [1, 0];
		tempDirection = [1, 0];
		nbSnakeSlow = 0;

		nbBeforeChangeMax = 30;
		nbBeforeChange = nbBeforeChangeMax;

		// init score
		scoreValue = 0;
		SCORE.textContent = scoreValue;

		// look key for direction
		document.addEventListener("keydown", moveDirection);

		// read JSon
		let levelJson;
		(async function(){
			try
			{
				let jsonFile = await fetch(JSON_FILE);

				if (jsonFile.ok)
				{
					let levelsJson = await jsonFile.json();
					
					// find the good level
					let levelChose = document.getElementById("level").value;
					let levels = levelsJson.levels;
					for (let level of levels)
					{
						if (level.level === parseInt(levelChose))
						{
							levelJson = level;
						}
					}
					// the game
					initGrid(levelJson);
					// wait 0.5s before lunch the game
					setTimeout(function(){
						snakeSpeed = levelJson.delay;
						intervalId = setInterval(loopGame, snakeSpeed);
					}, 800);
				}
				else
				{
					throw("Err " + jsonFile.status);
				}
			}
			catch(e)
			{
				console.log(e);
			}
		})();
	}

	/**
	 * init the grid of the beginning of the game
	 * @param {*} levelJson the jsObject from json with all level info
	 */
	function initGrid(levelJson)
	{
		
		// empty grid
		world = [];
		snakeBody = [];
		tabWall = [];
		sizeGrid = levelJson.dimension;
		for (let i = 0; i < sizeGrid; i++)
		{
			let tabi = [];
			for (let j = 0; j < sizeGrid; j++)
			{
				tabi.push(EMPTY);
			}
			world.push(tabi);
		}

		// snake position (can not be on a side)
		let x = Math.floor(Math.random() * (sizeGrid - 2) + 1); 
		let y = Math.floor(Math.random() * (sizeGrid - 2) + 1);
		world[x][y] = SNAKE;
		snakeBody.push([x, y]);

		// init an other part of the snakeBody
		if (x < (sizeGrid / 2))
		{
			snakeDirection[0] = 1;
			snakeBody.unshift([x-1, y]);
			world[x-1][y] = SNAKE;
		}
		else
		{
			snakeDirection[0] = -1;
			snakeBody.unshift([x+1, y]);
			world[x+1][y] = SNAKE;
		}
		world[x][y] = SNAKE;


		// init walls
		let nbWall = levelJson.walls;
		for (let i = 0; i < nbWall; i++)
		{
			let x;
			let y;
			let caseSideFree;
			// check if it's a valid wall (not on an other wall, on the snake or in front of the snake)
			do
			{
				x = Math.floor(Math.random() * sizeGrid);
				y = Math.floor(Math.random() * sizeGrid);
				let casesSide = [[x+1, y], [x-1, y], [x, y+1], [x, y-1]];
				caseSideFree = true;
				for (let caseSide of casesSide)
				{
					if (isInGrid(caseSide))
					{
						if (world[caseSide[0]][caseSide[1]] === SNAKE)
						{
							caseSideFree = false;
						}
					}
				}
			} while (world[x][y] !== EMPTY || !caseSideFree);

			// put the valid wall on the map
			world[x][y] = WALL;
			tabWall.push([x, y]);
		}

		// food
		generateFood();

		// draw the board
		CANVAS.setAttribute("width", sizeGrid * CASESIDE);
		CANVAS.setAttribute("height", sizeGrid * CASESIDE);
		drawCanva();
		
	}

	/**
	 * main game loop
	 */
	function loopGame()
	{
		tempDirection = snakeDirection;
		let snakeHead = [snakeBody[snakeBody.length - 1][0], snakeBody[snakeBody.length - 1][1]];

		// speed
		if (nbSnakeSlow > 0)
		{
			nbSnakeSlow--;
			if (nbSnakeSlow === 0)
			{
				snakeSpeed *= 0.6;
				clearInterval(intervalId);
				intervalId = setInterval(loopGame, snakeSpeed);
			}
		}

		// update the snakeBody
		if (snakeDirection[0] === 1)
		{
			snakeBody.push([snakeHead[0] + 1, snakeHead[1]]);
		}
		else if (snakeDirection[0] === -1)
		{
			snakeBody.push([snakeHead[0] - 1, snakeHead[1]]);
		}
		else if (snakeDirection[1] === 1)
		{
			snakeBody.push([snakeHead[0], snakeHead[1] + 1]);
		}
		else
		{
			snakeBody.push([snakeHead[0], snakeHead[1] - 1]);
		}

		let snakeTail = [snakeBody[0]];
		snakeHead = [snakeBody[snakeBody.length - 1][0], snakeBody[snakeBody.length - 1][1]];

		// look ig the snake is on smthg
			// if he is out of the grid
		if (!isInGrid(snakeHead))
		{
			endGame();
		}
		else
		{
				// if he's on the wall or on itself
			if ((world[snakeHead[0]][snakeHead[1]] === SNAKE && world[snakeHead[0]][snakeHead[1]] !== snakeTail)|| world[snakeHead[0]][snakeHead[1]] === WALL)
			{
				endGame();
			}
				// if he's on apple
			else if (world[snakeHead[0]][snakeHead[1]] === APPLE)
			{
				generateFood();
				nbBeforeChange = nbBeforeChangeMax;
				scoreValue ++;
				SCORE.textContent = scoreValue;
			}
				// if he's on Mushroom
			else if (world[snakeHead[0]][snakeHead[1]] === MUSHROOM)
			{
				snakeBody.shift();
				let beforeTail = snakeBody.shift();
				snakeTail.push(beforeTail);
				generateFood();
				nbBeforeChange = nbBeforeChangeMax;
				scoreValue--;
				SCORE.textContent = scoreValue;
			}
			else
			{
				snakeBody.shift();
			}

			// on bonus
			if (world[snakeHead[0]][snakeHead[1]] === PICKAXE)
			{
				// delete a random wall
				if (tabWall.length > 0)
				{
					let numWall = Math.floor(Math.random() * tabWall.length);
					let wallDelete = tabWall[numWall];
					tabWall.splice(numWall);
					nbBeforeChange = nbBeforeChangeMax;
					world[wallDelete[0]][wallDelete[1]] = EMPTY;
				}
				generateFood();
			}
			else if (world[snakeHead[0]][snakeHead[1]] === SNAIL)
			{
				// slow a bit
				if (nbSnakeSlow === 0)
				{
					snakeSpeed *= (100 / 60);
				}
				nbSnakeSlow += 15;
				clearInterval(intervalId);
				nbBeforeChange = nbBeforeChangeMax;
				intervalId = setInterval(loopGame, snakeSpeed);
				generateFood();
			}

			// change food/bonus
			nbBeforeChange--;
			if (nbBeforeChange <= 0)
			{
				nbBeforeChange = nbBeforeChangeMax;
				for (let i = 0; i < sizeGrid; i++)
				{
					for (let j = 0; j < sizeGrid; j++)
					{
						if (world[i][j] !== SNAKE && world[i][j] !== WALL && world[i][j] !== EMPTY)
						{
							world[i][j] = EMPTY;
						}
					}
				}
				generateFood();
			}
			
			putSnakeOnWorld(snakeTail);
		}

		// update the world and draw canva
		drawCanva();

	}

	/**
	 * setUp the score and toggle page for the end of the game
	 */
	function endGame()
	{
		// update score
		LASTSCORE.textContent = scoreValue;
		if (scoreValue > BESTSCORE.textContent)
		{
			BESTSCORE.textContent = scoreValue;
			localStorage.setItem("bestScore", scoreValue);
		}

		// clear canva and change page visibility
		clearInterval(intervalId);
		GAMEDIV.classList.toggle("hidden");
		PARADIV.classList.toggle("hidden");
	}

	/**
	 * update snakeDirection with the good direction
	 * @param {*} evt the touch pressed
	 */
	function moveDirection(evt)
	{
		// get the key pressed
		let touch = evt.key;

		// change direction for a valid direction
		if (touch === "ArrowUp" || touch === "z")
		{
			if (tempDirection[1] !== 1)
			{
				snakeDirection = [0, -1];
			}
		}
		else if (touch === "ArrowDown" || touch === "s")
		{
			if (tempDirection[1] !== -1)
			{
				snakeDirection = [0, 1];
			}
		}
		else if (touch === "ArrowRight" || touch === "d")
		{
			if (tempDirection[0] !== -1)
			{
				snakeDirection = [1, 0];
			}
		}
		else if (touch === "ArrowLeft" || touch === "q")
		{
			if (tempDirection[0] !== 1)
			{
				snakeDirection = [-1, 0];
			}
		}
	}
	
	/**
	 * put an apple on the board
	 */
	function generateFood()
	{
		let x;
		let y;
		let foodPossible;

		// find a valid place for food
		do
		{
			x = Math.floor(Math.random() * sizeGrid);
			y = Math.floor(Math.random() * sizeGrid);
			let casesSide = [[x+1, y], [x-1, y], [x, y+1], [x, y-1]];
			let nbSquareEmpty = 0;
			for (let square of casesSide)
			{
				if (isInGrid(square))
				{
					if (world[square[0]][square[1]] === EMPTY)
					{
						nbSquareEmpty ++;
					}
				}
			}
			if (nbSquareEmpty <= 1)
			{
				foodPossible = false;
			}
			else
			{
				foodPossible = true;
			}
			
		} while (world[x][y] !== EMPTY || !foodPossible);

		// chose type of the next spawn
		let eltSpawn = APPLE;
		if (BONUSMALUS.checked)
		{
			let randomElement = Math.floor(Math.random() * 9);
			if (randomElement === 0 && snakeBody.length > 3)
			{
				eltSpawn = MUSHROOM;
			}
			else if (randomElement === 1 && tabWall.length > 0)
			{
				eltSpawn = PICKAXE;
			}
			else if (randomElement === 2)
			{
				eltSpawn = SNAIL;
			}
			else
			{
				eltSpawn = APPLE;
			}
		}
		world[x][y] = eltSpawn;
	}

	/**
	 * draw the board on the CANVA with world
	 */
	function drawCanva()
	{
		// init empty canva and color
		ctx.clearRect(0, 0, sizeGrid * CASESIDE, sizeGrid * CASESIDE);
		let colorSnake = INPUTCOLOR.value;
		let colorFood = RED;
		let colorWall = GREY;
		let colorEmptyOdd = YELLOWGREEN;
		let colorEmptyEven = GREEN;

		// color each square of world
		for (let i = 0; i < sizeGrid; i++)
		{
			for (let j = 0; j < sizeGrid; j++)
			{
				let colorCase;
				if ((i + j) % 2 === 0)
				{
					colorCase = colorEmptyOdd;
				}
				else
				{
					colorCase = colorEmptyEven;
				}

				if (world[i][j] === EMPTY)
				{
					ctx.fillStyle = colorCase;
					ctx.fillRect(i * CASESIDE, j * CASESIDE, CASESIDE, CASESIDE);
				}
				else if (world[i][j] === SNAKE)
				{
					ctx.fillStyle = colorSnake;
					ctx.fillRect(i * CASESIDE, j * CASESIDE, CASESIDE, CASESIDE);

					// add a red square on the head of the snake
					if (i === snakeBody[snakeBody.length - 1][0] && j === snakeBody[snakeBody.length - 1][1])
					{
						ctx.fillStyle = RED;
						ctx.fillRect(i * CASESIDE + CASESIDE / 3, j * CASESIDE + CASESIDE / 3, CASESIDE / 3, CASESIDE / 3);
					}
					
				}
				else if (world[i][j] === APPLE)
				{
					ctx.fillStyle = colorCase;
					ctx.fillRect(i * CASESIDE, j * CASESIDE, CASESIDE, CASESIDE);
					ctx.drawImage(IMGAPPLE, i * CASESIDE, j * CASESIDE, CASESIDE, CASESIDE);
				}
				else if (world[i][j] === WALL)
				{
					ctx.fillStyle = colorWall;
					ctx.fillRect(i * CASESIDE, j * CASESIDE, CASESIDE, CASESIDE);
					ctx.drawImage(IMGWALL, i * CASESIDE, j * CASESIDE, CASESIDE, CASESIDE);
				}
				else if (world[i][j] === MUSHROOM)
				{
					ctx.fillStyle = colorCase;
					ctx.fillRect(i * CASESIDE, j * CASESIDE, CASESIDE, CASESIDE);
					ctx.drawImage(IMGMUSHROOM, i * CASESIDE, j * CASESIDE, CASESIDE, CASESIDE);
				}
				else if (world[i][j] === PICKAXE)
				{
					ctx.fillStyle = colorCase;
					ctx.fillRect(i * CASESIDE, j * CASESIDE, CASESIDE, CASESIDE);
					ctx.drawImage(IMGPICKAXE, i * CASESIDE, j * CASESIDE, CASESIDE, CASESIDE);
				}
				else if (world[i][j] === SNAIL)
				{
					ctx.fillStyle = colorCase;
					ctx.fillRect(i * CASESIDE, j * CASESIDE, CASESIDE, CASESIDE);
					ctx.drawImage(IMGSNAIL, i * CASESIDE, j * CASESIDE, CASESIDE, CASESIDE);
				}
			}
		}

	}

	/**
	 * put all the snakeTab on the world (board)
	 * @param {*} snakeTail the last tail of the snake 
	 */
	function putSnakeOnWorld(snakeTail)
	{
		// add to the world the snake body
		for (let snakePart of snakeBody)
		{
			let x = snakePart[0];
			let y = snakePart[1];
			world[x][y] = SNAKE;
		}

		// remove the last snake tail
		for (let partSnakeTail of snakeTail)
		{
			world[partSnakeTail[0]][partSnakeTail[1]] = EMPTY;
		}
	}

	/**
	 * Check if the case is on the board
	 * @param {*} square a case we want to check 
	 * @returns boolean if yes or not the case is in the board
	 */
	function isInGrid(square)
	{
		let x = square[0];
		let y = square[1];
		if (x < 0 || x >= sizeGrid || y < 0 || y >= sizeGrid)
		{
			return false;
		}
		else
		{
			return true;
		}
	}


})();
		
