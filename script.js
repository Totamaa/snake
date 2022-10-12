// jshint browser:true, eqeqeq:true, undef:true, devel:true, esversion: 9

(function()
{
	// JSON
	const JSON_FILE = "./save.json";
	
	// ELT DOM
	const BUTTONPLAY = document.getElementById("formButtonPlay");
	const INPUTCOLOR = document.getElementById("colorSnake");
	const CANVAS = document.getElementById("boardGame");
	const FORMPARA = document.getElementById("formPara");

	// MAP
	const CASESIDE = 20; // size of one case in px
	const EMPTY = 0;
	const SNAKE = 1;
	const FOOD = 2;
	const WALL = 3;
	let world; // map of the world

	// SNAKE
	let snakeBody; // tab of snake position
	let snakeDirection = [1, 0]; // direction vecteur of the snake

	// COLOR
	const RED = "#FF0000";
	const GREY = "AAAAAA";
	const WHITE = "FFFFFF";
	
	// play
	BUTTONPLAY.addEventListener("click", play2);

	function play2()
	{
		// init the game
		CANVAS.classList.toggle("hidden");
		FORMPARA.classList.toggle("hidden");

		document.addEventListener("keydown", moveDirection);

		let levelJson;

		fetch(JSON_FILE)
			.then(function(response)
			{
				if (response.ok)
				{
					levelJson = response.json();
				}
				else
				{
					throw ("Err: " + response.status);
				}
			})
			.then(function(levelJson){
				let levelChose = document.getElementById("level").value;
				let levels = levelJson.levels;

				for (let level of levels)
				{
					if (level.level === levelChose)
					{
						levelJson = level;
					}
				}
				console.log(levelJson);
				initGrid(levelJson);
			})
			.catch(function(err){
				console.log(err);
			});
	}
	
	/**
	 * function call when we want to play
	 */
	function play()
	{
		// init the game
		CANVAS.classList.toggle("hidden");
		FORMPARA.classList.toggle("hidden");

		document.addEventListener("keydown", moveDirection);

		let levelJson;
		(async function(){
			try
			{
				console.log(JSON_FILE);
				let jsonFile = await fetch(JSON_FILE);
				console.log(JSON_FILE);

				if (jsonFile.ok)
				{
					let levelChose = document.getElementById("level").value;
					let levelsJson = await jsonFile.json();
					let levels = levelsJson.levels;

					for (let level of levels)
					{
						if (level.level === levelChose)
						{
							levelJson = level;
						}
					}
					console.log(levelJson);
					initGrid(levelJson);
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
		let sizeGrid = levelJson.dimension;
		for (let i = 0; i < sizeGrid; i++)
		{
			for (let j = 0; j < sizeGrid; j++)
			{
				world[i][j] = EMPTY;
			}
		}

		// snake position (can not be on a side)
		let x = Math.floor(Math.random() * (sizeGrid - 2) + 1); 
		let y = Math.floor(Math.random() * (sizeGrid - 2) + 1);

		// snake direction (don't go to a side)
		if (x < sizeGrid / 2)
		{
			snakeDirection[0] = 1;
		}
		else
		{
			snakeDirection[0] = -1;
		}


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
				if (world[caseSide[0]][caseSide[1]] !== EMPTY)
				{
					caseSideFree = false;
				}
			}

			while (world[x][y] !== EMPTY && caseSideFree)
			{
				x = Math.floor(Math.random() * sizeGrid);
				y = Math.floor(Math.random() * sizeGrid);
			}

			world[x][y] = WALL;
		}

		// apple
		generateApple(levelJson.dimension);

		// draw the board
		drawCanva(levelJson.dimension);

		setInterval(levelJson.delay, loopGame);

		
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
				snakeDirection = [0, -1];
			}
		}
	}

	function drawCanva(sizeGrid)
	{
		let colorSnake = INPUTCOLOR.value;
		let colorFood = RED;
		let colorWall = GREY;
		let colorEmpty = WHITE;

		let ctx = CANVAS.getContext('2d');

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

	function generateApple(sizeGrid)
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

	function loopGame()
	{

		CANVAS.classList.toggle("hidden");
	}

})();
		
