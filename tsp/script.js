let HEIGHT = 10;
let WIDTH = 10;
let BOXES = 9;

let RX = 0,
    RY = 0;
let field = [];
let MOVE_COUNT = 0;

const dx = [-1, 1, 0, 0];
const dy = [0, 0, -1, 1];

const SLEEP_BETWEEN = 500;

let optimal = [];
let adj_points = [];
let optimal_score = 10000;

function getRandomInt(start, end, RNG) {
    let random = Math.abs(RNG.int32());
    return start + (random % (end - start + 1));
}

function valid(x, y) {
    return x >= 0 && y >= 0 && x < HEIGHT && x < WIDTH;
}

function markCell(x, y, type) {
    let color = "";
    if (type == "empty") color = "rgb(0, 64, 71)";
    else if (type == "marked") color = "green";
    else if (type == "optimal") color = "#eb4034";
    document.getElementById(x + "-" + y).style.backgroundColor = color;
}

function generateState(seed) {
    let RNG = new Math.seedrandom(seed);
    (RX = 0), (RY = 0);
    for (let i = 0; i < HEIGHT; i++) {
        field[i] = [];
        for (let j = 0; j < WIDTH; j++) {
            field[i][j] = 0;
        }
    }
    field[RX][RY] = 1;
    let numberBoxes = 0;
    while (numberBoxes < BOXES) {
        let x = getRandomInt(0, HEIGHT - 1, RNG);
        let y = getRandomInt(0, WIDTH - 1, RNG);
        if (field[x][y] == 0) {
            field[x][y] = 2;
            numberBoxes++;
        }
    }
    console.log(field);
}

function createGrid() {
    let gameContainer = document.getElementById("grid");
    for (let i = 0; i < HEIGHT; i++) {
        let row = document.createElement("div");
        row.classList.add("row");
        for (let j = 0; j < WIDTH; j++) {
            let cell = document.createElement("div");
            cell.classList.add("col");
            cell.id = i + "-" + j;
            row.appendChild(cell);
        }
        gameContainer.appendChild(row);
    }

    for (let i = 0; i < HEIGHT; i++) {
        for (let j = 0; j < WIDTH; j++) {
            markCell(i, j, "empty");
        }
    }
}

function draw(f) {
    for (let i = 0; i < HEIGHT; i++) {
        for (let j = 0; j < WIDTH; j++) {
            let cell = document.getElementById(i + "-" + j);
            cell.innerHTML = "";
            if (i == RX && j == RY) {
                let robot = document.createElement("div");
                robot.classList.add("icon");
                robot.innerHTML = "R";
                cell.appendChild(robot);
            } else if (f[i][j] == 2 || f[i][j] == 3) {
                let box = document.createElement("div");
                box.classList.add("icon");
                box.innerHTML = "B";
                cell.appendChild(box);
            }
        }
    }
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function bfs(adj_points, i) {
    let p1 = adj_points[i];
    if (!(p1.x >= 0 && p1.y >= 0 && p1.x < HEIGHT && p1.y < WIDTH)) {
        let result = Array(adj_points.length);
        for (let i = 0; i < adj_points.length; i++) {
            result[i] = 10000;
        }
        return result;
    }

    console.log(p1);

    let dist = [];
    for (let i = 0; i < HEIGHT; i++) {
        dist[i] = Array(WIDTH);
        for (let j = 0; j < WIDTH; j++) {
            dist[i][j] = 10000;
        }
    }

    dist[p1.x][p1.y] = 0;
    let queue = [];
    let p = 0;
    queue.push(p1);
    while (p < queue.length) {
        let top = queue[p];
        p++;

        for (let dir = 0; dir < 4; dir++) {
            let nx = top.x + dx[dir];
            let ny = top.y + dy[dir];
            if (nx >= 0 && ny >= 0 && nx < HEIGHT && ny < WIDTH) {
                if (
                    field[nx][ny] != 2 &&
                    dist[nx][ny] > dist[top.x][top.y] + 1
                ) {
                    dist[nx][ny] = dist[top.x][top.y] + 1;
                    queue.push({ x: nx, y: ny });
                }
            }
        }
    }

    let result = Array(adj_points.length);
    for (let i = 0; i < adj_points.length; i++) {
        let x = adj_points[i].x;
        let y = adj_points[i].y;
        if (x >= 0 && y >= 0 && x < HEIGHT && y < WIDTH) {
            result[i] = dist[x][y];
        } else {
            result[i] = 10000;
        }
    }
    return result;
}

function TSP() {
    adj_points = [];
    for (let i = 0; i < WIDTH; i++) {
        for (let j = 0; j < HEIGHT; j++) {
            if (field[i][j] == 2) {
                for (let dir = 0; dir < 4; dir++) {
                    let nx = i + dx[dir];
                    let ny = j + dy[dir];
                    adj_points.push({ x: nx, y: ny });
                }
            }
        }
    }

    adj_points.push({ x: RX, y: RY });

    let dist = [];
    const INF = 10000;
    let N = 4 * BOXES + 1;
    let M = BOXES + 1;
    for (let i = 0; i < N; i++) {
        dist[i] = Array(N);
        for (let j = 0; j < N; j++) {
            if (i == j) dist[i][j] = 0;
            else dist[i][j] = INF;
        }
    }

    for (let i = 0; i < N; i++) {
        dist[i] = bfs(adj_points, i);
    }

    console.log(dist);

    let dp = [];
    let pr = [];
    // dp[i][mask] - the cost of marking all boxes in mask
    //               ending up at ith adjacency point

    for (let i = 0; i < N; i++) {
        dp[i] = Array(1 << M);
        pr[i] = Array(1 << M);
        for (let j = 0; j < 1 << M; j++) {
            dp[i][j] = 10000;
            pr[i][j] = -1;
        }
    }

    dp[N - 1][0] = 0;

    for (let mask = 0; mask < 1 << M; mask++) {
        for (let last = 0; last < N; last++) {
            for (let next = 0; next < N; next++) {
                let next_node = next / 4;
                if ((mask & (1 << next_node)) == 0) {
                    if (dp[next][mask | (1 << next_node)] > dp[last][mask] + dist[last][next]) {
                        dp[next][mask | (1 << next_node)] = dp[last][mask] + dist[last][next];
                        pr[next][mask | (1 << next_node)] = last;
                    }
                }
            }
        }
    }

    console.log(dp);

    let bestLast = 0;
    for (let last = 0; last < N; last++) {
        if (dp[last][(1 << M) - 1] < dp[bestLast][(1 << M) - 1]) {
            bestLast = last;
        }
    }

    optimal_score = dp[bestLast][(1 << M) - 1];
    if (optimal_score == INF) {
        window.location.reload();
    }
    
    console.log("best dp: " + optimal_score);

    optimal = [];
    let p = bestLast;
    let mask = (1 << M) - 1;
    for (let i = 0; i < BOXES; i++) {
        optimal.push(p);
        let old_p = p;
        p = pr[p][mask];
        mask = mask & ~(1 << (old_p / 4));
    }
}

function canMove(x, y) {
    return valid(x, y) && field[x][y] == 0;
}

async function moveRight() {
    if (!canMove(RX, RY + 1)) return;
    MOVE_COUNT++;
    RY++;
    draw(field);
    await sleep(SLEEP_BETWEEN);
}

async function moveLeft() {
    if (!canMove(RX, RY - 1)) return;
    MOVE_COUNT++;
    RY--;
    draw(field);
    await sleep(SLEEP_BETWEEN);
}

async function moveUp() {
    if (!canMove(RX - 1, RY)) return;
    MOVE_COUNT++;
    RX--;
    draw(field);
    await sleep(SLEEP_BETWEEN);
}

async function moveDown() {
    if (!canMove(RX + 1, RY)) return;
    MOVE_COUNT++;
    RX++;
    draw(field);
    await sleep(SLEEP_BETWEEN);
}

async function markRight() {
    if (RY + 1 >= WIDTH) return;
    mark(RX, RY + 1);
    draw(field);
    await sleep(SLEEP_BETWEEN);
}

async function markLeft() {
    if (RY - 1 < 0) return;
    mark(RX, RY - 1);
    draw(field);
    await sleep(SLEEP_BETWEEN);
}

async function markUp() {
    if (RX - 1 < 0) return;
    mark(RX - 1, RY);
    draw(field);
    await sleep(SLEEP_BETWEEN);
}

async function markDown() {
    if (RX + 1 >= HEIGHT) return;
    mark(RX + 1, RY);
    draw(field);
    await sleep(SLEEP_BETWEEN);
}

function mark(x, y) {
    if (field[x][y] == 2) {
        field[x][y] = 3;
        markCell(x, y, "marked");
    }
}

function checkEnd() {
    let markedCount = 0;
    for (let i = 0; i < HEIGHT; i++) {
        for (let j = 0; j < WIDTH; j++) {
            if (field[i][j] == 3) {
                markedCount++;
            }
        }
    }
    if (markedCount != BOXES) {
        alert("You only marked " + markedCount + " box" + (markedCount == 1 ? "" : "es") + "!");
    } else {
        alert("Accepted! Got score of " + (optimal_score / MOVE_COUNT) * 100 + " points!");
    }
}

let demoWorkspace;

window.addEventListener("load", () => {
    createGrid();
    generateState(Math.random());
    draw(field);
    TSP();

    Blockly.Theme.defineTheme("dark", {
        base: Blockly.Themes.Classic,
        componentStyles: {
            workspaceBackgroundColour: "#1e1e1e",
            toolboxBackgroundColour: "blackBackground",
            toolboxForegroundColour: "#fff",
            flyoutBackgroundColour: "#252526",
            flyoutForegroundColour: "#ccc",
            flyoutOpacity: 1,
            scrollbarColour: "#797979",
            insertionMarkerColour: "#fff",
            insertionMarkerOpacity: 0.3,
            scrollbarOpacity: 0.4,
            cursorColour: "#d0d0d0",
            blackBackground: "#333",
        },
    });

    demoWorkspace = Blockly.inject("blocklyDiv", {
        toolbox: document.getElementById("toolbox-categories"),
        theme: "dark",
    });

    defineBlocks();
    defineGenerator();

    // Blockly.serialization.workspaces.load(startBlocks, demoWorkspace);
});

function showCode() {
    // Generate JavaScript code and display it.
    javascript.javascriptGenerator.INFINITE_LOOP_TRAP = null;
    var code = javascript.javascriptGenerator.workspaceToCode(demoWorkspace);
    alert(code);
}

function runCode() {
    // Generate JavaScript code and run it.
    window.LoopTrap = 1000;
    javascript.javascriptGenerator.INFINITE_LOOP_TRAP =
        'if (--window.LoopTrap < 0) throw "Infinite loop.";\n';
    var code =
        "(async () => {" +
        javascript.javascriptGenerator.workspaceToCode(demoWorkspace) +
        " checkEnd(); })();";
    javascript.javascriptGenerator.INFINITE_LOOP_TRAP = null;
    try {
        eval(code);
    } catch (e) {
        alert(e);
    }
}

function showOptimalMarkings() {
    for (let point of optimal) {
        let x = adj_points[point].x;
        let y = adj_points[point].y;
        markCell(x, y, "optimal");
    }
}

function reset() {
    MOVE_COUNT = 0;
    RX = 0;
    RY = 0;
    for (let i = 0; i < HEIGHT; i++) {
        for (let j = 0; j < WIDTH; j++) {
            if (field[i][j] == 3) {
                markCell(i, j, "empty");
                field[i][j] = 2;
            }
        }
    }
    draw(field);
}
