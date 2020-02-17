/*
* @Author: H-f-society
* @Date:   2020-02-16 20:48:14
* @Last Modified by:   H-f-society
* @Last Modified time: 2020-02-17 22:35:09
*/
var GameConfig = function() {
	this.ImagePath = "image/style0/";	// 图片素材路径
	this.ImageType = ".gif";	// 图片素材后缀
	this.MapSize   = 700;	// canva宽高大小
	this.GridNum   = 15;	// 单元格大小
	this.MineNum   = 50;	// 地雷数量
	this.dires     = [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [-1, 1], [1, 1], [1, -1]]; // 八个方向
	this.MinePS    = new Array(); // 所有地雷的坐标位置,用于游戏失败时快速加载出所有地雷
	this.MapFlag;	// 备用地图，立flag用，耗双倍空间可以换其他方法，但已经写了懒得改
	this.GameMap;	// 游戏地图
}
GameConfig.prototype.InitGameMap = function() {	//初始化游戏地图
	this.GameMap = new Array(this.GridNum);
	this.MapFlag = new Array(this.GridNum);
	for(let i=0; i<this.GridNum; i++) {
		this.GameMap[i] = new Array(this.GridNum);
		this.MapFlag[i] = new Array(this.GridNum);
		this.GameMap[i].fill("0");
		this.MapFlag[i].fill("0");
	}
	for(let i=0; i<this.GridNum; i++) {	//对每个单元格进行图片绘制
		for(let j=0; j<this.GridNum; j++) {
			draw.drawRole(i, j, "grid");
		}
	}
}
GameConfig.prototype.setMapFlag = function(x, y, p) { this.MapFlag[x][y] = p; }
GameConfig.prototype.createMine = function(point) { // 随机生成地雷位置，冲突点跳过换另一个点
	let x = parseInt((Math.random()*this.GridNum).toString(10));
	let y = parseInt((Math.random()*this.GridNum).toString(10));
	if((x!=point[0] && y!=point[1]) && this.GameMap[x][y] != "x") {
		this.MineNum--;	// 每生成一个地雷数量-1
		this.GameMap[x][y] = "x"; // 地图上标记地雷位置
		this.createNum(new Array(x, y)); // 对雷区附件八个位置标上数字
		this.MinePS.push(new Array(x, y));
	}else
		this.createMine(point);
	if(this.MineNum > 0) this.createMine(point);
}
GameConfig.prototype.createNum = function(point) { //动态规划，地雷生成过后对雷周围的位置填入数字
	for(let j=0; j<this.dires.length; j++) {
		let x = point[0] + this.dires[j][0];
		let y = point[1] + this.dires[j][1];
		if(isTransboundary(this.GameMap, x, y) && this.GameMap[x][y]!="x") {
			this.GameMap[x][y] = parseInt(this.GameMap[x][y]) + 1 + ""; // 新增地雷时数字基础上+1
		}
	}
	function isTransboundary(map, x, y) {	// 越界判断
		if(x>=0 && x<map.length && y>=0 && y<map[0].length) 
			return true;
		return false;
	}
}
GameConfig.prototype.BFS = function(point) { // 广度优先遍历空位
	var flag = new Array(this.GridNum);
	for(let i=0; i<this.GridNum; i++) {
		flag[i] = new Array(this.GridNum);
		flag[i].fill(0);
	}
	var que = new Array();
	que.push(point);
	flag[point[0]][point[1]] = 1;
	while(que.length > 0) {
		let ps = que.shift();
		for(let i=0; i<8; i++) {
			let x = ps[0] + this.dires[i][0];
			let y = ps[1] + this.dires[i][1];
			if(isTransboundary(this.GameMap, x, y) && this.GameMap[x][y]!="x" && flag[x][y]==0) {
				if(this.dires[i][0]*this.dires[i][1]!=0 && this.GameMap[x][y]=="0")
					continue;	//如果是斜对角位置为空则跳过不用打开
				draw.drawRole(y, x, this.GameMap[x][y]); // 根据当前单元格上的表示绘制图片
				if(this.GameMap[x][y] == "0")	// 如果空位则加入队列继续广搜
					que.push(new Array(x, y));				
				flag[x][y] = 1;	//对经过的点做flag标记，同样耗双倍空间，可以换其他写法
				this.setMapFlag(x, y, "o");
			}
		}
	}
	function isTransboundary(map, x, y) {
		if(x>=0 && x<map.length && y>=0 && y<map[0].length) 
			return true;
		return false;
	}
}
var Draw = function() {
	this.drawRole = function(x, y, role) {	// 绘制角色
		let size = config.MapSize / config.GridNum;
		let img = new Image();
		img.src = config.ImagePath + role + config.ImageType;
		img.onload = function() {
			ctx.drawImage(img, x*size, y*size, size, size);
		}
	}
}

var canvas = document.getElementById("box");
var ctx    = canvas.getContext("2d");

var config = new GameConfig();
var draw   = new Draw();

canvas.width  = config.MapSize;
canvas.height = config.MapSize;

config.InitGameMap();

var clickCount = 0;
canvas.onmouseup = function(e) {
	let x = Math.floor(e.offsetY/(config.MapSize/config.GridNum));
	let y = Math.floor(e.offsetX/(config.MapSize/config.GridNum));
	if(e.button == 0 && config.MapFlag[x][y]=="0") {
		if(clickCount == 0) {
			config.createMine(new Array(x, y));
			//config.createNum();
			console.log(config.GameMap);
		}
		clickCount++;

		draw.drawRole(y, x, config.GameMap[x][y]);
		config.setMapFlag(x, y, "o");
		if(config.GameMap[x][y] == "0")
			config.BFS(new Array(x, y));
		if(config.GameMap[x][y] == "x") {
			for(let i=0; i<config.MinePS.length; i++) {
				let mineX = config.MinePS[i][0];
				let mineY = config.MinePS[i][1];
				draw.drawRole(mineY, mineX, config.GameMap[mineX][mineY]);
			}
		}
	}else if(e.button == 2) {
		if(config.MapFlag[x][y] == "0") {
			config.setMapFlag(x, y, "x");
			draw.drawRole(y, x, "flag");
		}else if(config.MapFlag[x][y] == "x") {
			config.setMapFlag(x, y, "0");
			draw.drawRole(y, x, "grid");
		}
	}
}
document.oncontextmenu = function(){ event.returnValue = false; }	// 禁用右键菜单栏