let HEIGHT = 10;
let WIDTH = 10;
let BOXES = 9;

let RX = 0,
    RY = 0;
let field = [];
let MOVE_COUNT = 0;

const dx = [-1, 1, 0, 0];
const dy = [0, 0, -1, 1];
const op = [1, 0, 3, 2];
const dc = ['up', 'down', 'left', 'right'];

const SLEEP_BETWEEN = 500;
const INF = 10000;

let optimal = [];
let adj_points = [];
let box_positions = [];
let optimal_score = INF;
let optimal_moves = [];

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
                robot.innerHTML = "🤖";
                cell.appendChild(robot);
            } else if (f[i][j] == 2 || f[i][j] == 3) {
                let box = document.createElement("div");
                box.classList.add("icon");
                box.innerHTML = "📦";
                cell.appendChild(box);
            }
        }
    }
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function bfs(adj_points, i) {
    // Initialize all arrays
    let dist = [];
    let parent = [];
    for (let i = 0; i < HEIGHT; i++) {
        dist[i] = Array(WIDTH);
        parent[i] = Array(WIDTH);
        for (let j = 0; j < WIDTH; j++) {
            dist[i][j] = INF;
            parent[i][j] = -1;
        }
    }
    
    let result = Array(adj_points.length);
    for (let i = 0; i < adj_points.length; i++) {
        result[i] = INF;
    }

    // Check if the starting point is valid
    let p1 = adj_points[i];
    if (!valid(p1.x, p1.y)) {
        return { result, parent };
    }

    // Run the BFS
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
            if (valid(nx, ny) && field[nx][ny] != 2) {
                if (dist[nx][ny] > dist[top.x][top.y] + 1) {
                    dist[nx][ny] = dist[top.x][top.y] + 1;
                    parent[nx][ny] = dir;
                    queue.push({ x: nx, y: ny });
                }
            }
        }
    }

    // Write down the interesting distances in another array
    for (let i = 0; i < adj_points.length; i++) {
        let x = adj_points[i].x;
        let y = adj_points[i].y;
        if (valid(x, y)) {
            result[i] = dist[x][y];
        }
    }
    return { result, parent };
}

function TSP() {
    adj_points = [];
    box_positions = [];
    for (let i = 0; i < WIDTH; i++) {
        for (let j = 0; j < HEIGHT; j++) {
            if (field[i][j] == 2) {
                box_positions.push({ x: i, y: j });
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
    let parents = [];
    let N = 4 * BOXES + 1;
    let M = BOXES + 1;
    for (let i = 0; i < N; i++) {
        dist[i] = Array(N);
        parents[i] = [];
        for (let j = 0; j < N; j++) {
            if (i == j) dist[i][j] = 0;
            else dist[i][j] = INF;
        }
    }
    
    for (let i = 0; i < N; i++) {
        let bfsResult = bfs(adj_points, i);
        dist[i] = bfsResult.result;
        parents[i] = bfsResult.parent;
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
            dp[i][j] = INF;
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

    // Find the best DP
    let bestLast = 0;
    for (let last = 0; last < N; last++) {
        if (dp[last][(1 << M) - 1] < dp[bestLast][(1 << M) - 1]) {
            bestLast = last;
        }
    }

    // If optimal score is INF, it means that we cannot solve the state
    optimal_score = dp[bestLast][(1 << M) - 1];
    if (optimal_score == INF) {
        window.location.reload();
    }
    
    console.log("best dp: " + optimal_score);

    // Reconstruct the optimal sequence of markings
    optimal = [];
    let p = bestLast;
    let mask = (1 << M) - 1;
    for (let i = 0; i < BOXES; i++) {
        optimal.push(p);
        let old_p = p;
        p = pr[p][mask];
        mask = mask & ~(1 << (old_p / 4));
    }

    // Reconstruct moves
    optimal = optimal.reverse();
    for (let i = 0; i < optimal.length; i++) {
        if (i == 0) {
            constructPath({ x: RX, y: RY }, adj_points[optimal[i]], parents[N - 1]);
        } else {
            constructPath(adj_points[optimal[i-1]], adj_points[optimal[i]], parents[optimal[i-1]]);
        }
        
        // Figure out on which side we should mark
        let point = adj_points[optimal[i]];
        let node = Math.floor(optimal[i] / 4);
        for (let dir = 0; dir < 4; dir++) {
            let nx = point.x + dx[dir];
            let ny = point.y + dy[dir];
            if (valid(nx, ny) && box_positions[node].x == nx && box_positions[node].y == ny) {
                optimal_moves.push({ type: "mark", dir });
                break;
            }
        }
    }

    console.log(optimal_moves);
}

function constructPath(p1, p2, parents) {
    let moves = [];
    while (parents[p2.x][p2.y] != -1) {
        let dir = parents[p2.x][p2.y];
        let nx = p2.x + dx[op[dir]];
        let ny = p2.y + dy[op[dir]];
        moves.push({ type: "move", dir });
        p2 = { x: nx, y: ny };
    }
    moves = moves.reverse();
    for (let move of moves) optimal_moves.push(move);
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

let workspace;

window.addEventListener("load", () => {
    createGrid();
    let seed = Math.random();
    document.getElementById('seed').innerHTML = seed;
    generateState(seed);
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

    workspace = Blockly.inject("blocklyDiv", {
        toolbox: document.getElementById("toolbox-categories"),
        theme: "dark",
    });

    defineBlocks();
    defineGenerator();

    // Blockly.serialization.workspaces.load(startBlocks, workspace);
});

function showCode() {
    // Generate JavaScript code and display it.
    javascript.javascriptGenerator.INFINITE_LOOP_TRAP = null;
    let code = javascript.javascriptGenerator.workspaceToCode(workspace);
    alert(code);
}

function runCode() {
    // Generate JavaScript code and run it.
    window.LoopTrap = 1000;
    javascript.javascriptGenerator.INFINITE_LOOP_TRAP =
        'if (--window.LoopTrap < 0) throw "Infinite loop.";\n';
    let code =
        "(async () => {" +
        javascript.javascriptGenerator.workspaceToCode(workspace) +
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

function exportBlockly() {
    let xml = Blockly.Xml.workspaceToDom(workspace);
    console.log(xml);
}

function createForLoop(doc, parent, children, count) {
    let forBlock = doc.createElement('block');
    forBlock.setAttribute('type', 'controls_repeat_ext');

    let val = doc.createElement('value');
    val.setAttribute('name', "TIMES");
    forBlock.appendChild(val);
    
    let shadow = doc.createElement('shadow');
    shadow.setAttribute('type', 'math_number');
    val.appendChild(shadow);

    let shadow_field = doc.createElement('field');
    shadow_field.setAttribute('name', 'NUM');
    shadow_field.innerHTML = count;
    shadow.appendChild(shadow_field);

    let statement = doc.createElement('statement');
    statement.setAttribute('name', 'DO');
    forBlock.appendChild(statement);

    for (let child of children) {
        statement.appendChild(child);
    }

    parent.appendChild(forBlock);
}

function dfsCreate(doc, i) {
    if (i >= optimal_moves.length) return null;
    
    // Create my block
    let me = doc.createElement('block');
    let move = optimal_moves[i];
    let command = (move.type + "_" + dc[move.dir]);
    me.setAttribute('type', command);

    let children = dfsCreate(doc, i + 1);

    if (children != null) {
        let nextBlock = doc.createElement('next');
        nextBlock.appendChild(children);
        me.appendChild(nextBlock);
    }

    return me;
}

function solveBlockly() {
    let doc = document.implementation.createDocument("", "", null);
    let xml = doc.createElement('xml');
    doc.appendChild(xml);

    let blocks = dfsCreate(doc, 0);
    xml.appendChild(blocks);

    console.log(doc);
    let result = Blockly.Xml.domToWorkspace(xml, workspace);
    console.log(result);
}
