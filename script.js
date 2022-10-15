// jshint browser:true, eqeqeq:true, undef:true, devel:true, esversion: 9

(function()
{
	// JSON
	const JSON_FILE = "save.json";
	
	// ELT DOM
	const BUTTONPLAY = document.getElementById("formButtonPlay");
	const INPUTCOLOR = document.getElementById("colorSnake");
	const CANVAS = document.getElementById("boardGame");
	const GAMEPAGE = document.getElementById("gamePage");
	const FORMPARA = document.getElementById("paraPage");

	// MAP
	const CASESIDE = 20; // size of one case in px
	const EMPTY = 0;
	const SNAKE = 1;
	const FOOD = 2;
	const WALL = 3;
	let world; // map of the world
	let sizeGrid;
	let ctx;

	// SNAKE
	let snakeBody; // tab of snake position
	let snakeDirection = [1, 0]; // direction vecteur of the snake
	let foodEat = false;

	// COLOR
	const RED = "#FF0000";
	const GREY = "#555555";
	const WHITE = "#FFFFFF";
	const LIGHTGREY = "#AAAAAA";
	
	// play
	let intervalId;
	BUTTONPLAY.addEventListener("click", play);
	
	/**
	 * function call when we want to play
	 */
	function play()
	{
		// init the game
		GAMEPAGE.classList.toggle("hidden");
		FORMPARA.classList.toggle("hidden");

		document.addEventListener("keydown", moveDirection);

		let levelJson;
		(async function(){
			try
			{
				let jsonFile = await fetch(JSON_FILE);

				if (jsonFile.ok)
				{
					let levelChose = document.getElementById("level").value;
					let levelsJson = await jsonFile.json();
					let levels = levelsJson.levels;
					for (let level of levels)
					{
						if (level.level == levelChose)
						{
							levelJson = level;
						}
					}
					initGrid(levelJson);
					intervalId = setInterval(loopGame, levelJson.delay);
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

	function initGrid(levelJson)
	{
		
		// empty grid
		world = [];
		snakeBody = [];
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
		snakeBody.push([x, y]);

		// snake direction (don't go to a side)
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


		// walls
		let nbWall = levelJson.walls;
		for (let i = 0; i < nbWall; i++)
		{
			// case vide
			let x = Math.floor(Math.random() * sizeGrid);
			let y = Math.floor(Math.random() * sizeGrid);
			let casesSide = [[x+1, y], [x-1, y], [x, y+1], [x, y-1]];
			let caseSideFree = true;
			for (let caseSide of casesSide)
			{
				if (caseSide[0] >= 0 && caseSide[0] < sizeGrid && caseSide[1] >= 0 && caseSide[1] < sizeGrid)
				{
					if (world[caseSide[0]][caseSide[1]] !== EMPTY)
					{
						caseSideFree = false;
					}
				}
			}

			while (world[x][y] !== EMPTY && !caseSideFree)
			{
				x = Math.floor(Math.random() * sizeGrid);
				y = Math.floor(Math.random() * sizeGrid);
			}

			world[x][y] = WALL;
		}

		// apple
		generateApple(levelJson.dimension);

		// draw the board
		CANVAS.setAttribute("width", sizeGrid * CASESIDE);
		CANVAS.setAttribute("height", sizeGrid * CASESIDE);
		ctx = CANVAS.getContext('2d');
		drawCanva();
		
	}

	function loopGame()
	{
		let snakeHead = [snakeBody[snakeBody.length - 1][0], snakeBody[snakeBody.length - 1][1]];
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

		let snakeTail = snakeBody[0];

		snakeHead = [snakeBody[snakeBody.length - 1][0], snakeBody[snakeBody.length - 1][1]];

		if (snakeHead[0] > sizeGrid - 1 || snakeHead[1] > sizeGrid - 1 || snakeHead[0] < 0 || snakeHead[1] < 0)
		{
			endGame();
		}
		if (world[snakeHead[0]][snakeHead[1]] === SNAKE || world[snakeHead[0]][snakeHead[1]] === WALL)
		{
			endGame();	
		}
		if (world[snakeHead[0]][snakeHead[1]] === FOOD)
		{
			generateApple();
		}
		else
		{
			snakeBody.shift();
		}

		putSnakeOnWorld(snakeTail);
		drawCanva();
	}

	function endGame()
	{
		clearInterval(intervalId);
		GAMEPAGE.classList.toggle("hidden");
		FORMPARA.classList.toggle("hidden");
	}

	function moveDirection(evt)
	{
		let touch = evt.key;
		if (touch === "ArrowUp")
		{
			if (snakeDirection[1] !== 1)
			{
				snakeDirection = [0, -1];
			}
		}
		else if (touch === "ArrowDown")
		{
			if (snakeDirection[1] !== -1)
			{
				snakeDirection = [0, 1];
			}
		}
		else if (touch === "ArrowRight")
		{
			if (snakeDirection[0] !== -1)
			{
				snakeDirection = [1, 0];
			}
		}
		else if (touch === "ArrowLeft")
		{
			if (snakeDirection[0] !== 1)
			{
				snakeDirection = [-1, 0];
			}
		}
	}
	
	function generateApple()
	{
		let x = Math.floor(Math.random() * sizeGrid);
		let y = Math.floor(Math.random() * sizeGrid);
		while (world[x][y] !== EMPTY)
		{
			x = Math.floor(Math.random() * sizeGrid);
			y = Math.floor(Math.random() * sizeGrid);
		}

		world[x][y] = FOOD;
	}

	function drawCanva()
	{
		ctx.clearRect(0, 0, sizeGrid * CASESIDE, sizeGrid * CASESIDE);
		let colorSnake = INPUTCOLOR.value;
		let colorFood = RED;
		let colorWall = GREY;
		let colorEmpty = LIGHTGREY;

		for (let i = 0; i < sizeGrid; i++)
		{
			for (let j = 0; j < sizeGrid; j++)
			{
				if (world[i][j] === EMPTY)
				{
					ctx.fillStyle = colorEmpty;
					ctx.fillRect(i * CASESIDE, j * CASESIDE, CASESIDE, CASESIDE);
				}
				if (world[i][j] === SNAKE)
				{
					ctx.fillStyle = colorSnake;
					ctx.fillRect(i * CASESIDE, j * CASESIDE, CASESIDE, CASESIDE);
					if (i === snakeBody[snakeBody.length - 1][0] && j === snakeBody[snakeBody.length - 1][1])
					{
						ctx.fillStyle = RED;
						ctx.fillRect(i * CASESIDE + CASESIDE / 3, j * CASESIDE + CASESIDE / 3, CASESIDE / 3, CASESIDE / 3);
					}
					
				}
				if (world[i][j] === FOOD)
				{
					ctx.fillStyle = colorFood;
					ctx.fillRect(i * CASESIDE, j * CASESIDE, CASESIDE, CASESIDE);
				}
				if (world[i][j] === WALL)
				{
					ctx.fillStyle = colorWall;
					ctx.fillRect(i * CASESIDE, j * CASESIDE, CASESIDE, CASESIDE);
				}
			}
		}

	}

	function putSnakeOnWorld(snakeTail)
	{
		for (let snakePart of snakeBody)
		{
			let x = snakePart[0];
			let y = snakePart[1];
			world[x][y] = SNAKE;
		}
		world[snakeTail[0]][snakeTail[1]] = EMPTY;
	}

})();
		
