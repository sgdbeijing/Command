class Main extends egret.DisplayObjectContainer {

    map:GameMap;
    grid:Grid;
    tileSize = 64;

    /**
     * 加载进度界面
     * Process interface loading
     */
    private loadingView:LoadingUI;

    public constructor() {
        super();
        this.addEventListener(egret.Event.ADDED_TO_STAGE, this.onAddToStage, this);
    }

    private onAddToStage(event:egret.Event) {
        //设置加载进度界面
        //Config to load process interface
        this.loadingView = new LoadingUI();
        this.stage.addChild(this.loadingView);

        //初始化Resource资源加载库
        //initiate Resource loading library
        RES.addEventListener(RES.ResourceEvent.CONFIG_COMPLETE, this.onConfigComplete, this);
        RES.loadConfig("resource/default.res.json", "resource/");
    }

    /**
     * 配置文件加载完成,开始预加载preload资源组。
     * configuration file loading is completed, start to pre-load the preload resource group
     */
    private onConfigComplete(event:RES.ResourceEvent):void {
        RES.removeEventListener(RES.ResourceEvent.CONFIG_COMPLETE, this.onConfigComplete, this);
        RES.addEventListener(RES.ResourceEvent.GROUP_COMPLETE, this.onResourceLoadComplete, this);
        RES.addEventListener(RES.ResourceEvent.GROUP_LOAD_ERROR, this.onResourceLoadError, this);
        RES.addEventListener(RES.ResourceEvent.GROUP_PROGRESS, this.onResourceProgress, this);
        RES.addEventListener(RES.ResourceEvent.ITEM_LOAD_ERROR, this.onItemLoadError, this);
        RES.loadGroup("preload");
    }

    /**
     * preload资源组加载完成
     * Preload resource group is loaded
     */
    private onResourceLoadComplete(event:RES.ResourceEvent):void {
        if (event.groupName == "preload") {
            this.stage.removeChild(this.loadingView);
            RES.removeEventListener(RES.ResourceEvent.GROUP_COMPLETE, this.onResourceLoadComplete, this);
            RES.removeEventListener(RES.ResourceEvent.GROUP_LOAD_ERROR, this.onResourceLoadError, this);
            RES.removeEventListener(RES.ResourceEvent.GROUP_PROGRESS, this.onResourceProgress, this);
            RES.removeEventListener(RES.ResourceEvent.ITEM_LOAD_ERROR, this.onItemLoadError, this);
            this.createGameScene();
        }
    }

    /**
     * 资源组加载出错
     *  The resource group loading failed
     */
    private onItemLoadError(event:RES.ResourceEvent):void {
        console.warn("Url:" + event.resItem.url + " has failed to load");
    }

    /**
     * 资源组加载出错
     *  The resource group loading failed
     */
    private onResourceLoadError(event:RES.ResourceEvent):void {
        //TODO
        console.warn("Group:" + event.groupName + " has failed to load");
        //忽略加载失败的项目
        //Ignore the loading failed projects
        this.onResourceLoadComplete(event);
    }

    /**
     * preload资源组加载进度
     * Loading process of preload resource group
     */
    private onResourceProgress(event:RES.ResourceEvent):void {
        if (event.groupName == "preload") {
            this.loadingView.setProgress(event.itemsLoaded, event.itemsTotal);
        }
    }

    private textfield:egret.TextField;

    /**
     * 创建游戏场景
     * Create a game scene
     */
    private createGameScene():void {

        var list = new CommandList();
        CommandList.setCurrentList(list);

        var gameScence = new egret.DisplayObjectContainer();
        var infoScence = new egret.DisplayObjectContainer();

//地图和人物部分

        var numCols = 10;
        var numRows = 10;

        this.touchEnabled = true;

        this.map = new GameMap(numCols,numRows);
        gameScence.addChild(this.map);

        this.grid = new Grid(numCols,numRows);
        this.grid.initWalkable();

        var player = new Player(this.grid,this.tileSize);
        Player.setPlayer(player);

        gameScence.addChild(player.playerStage);

//地图和人物部分结束


//任务和NPC和怪物部分

        this.touchEnabled = true;

        var scenceService = new SceneService()

        var taskService = new TaskService(scenceService);

        var taskPanel = new TaskPanel(gameScence,taskService);

        var dialoguePanel = new DialoguePanel(gameScence,taskService);

        DialoguePanel.setDialoguePanel(dialoguePanel);

        var npc_0 = new NPC("npc_0",taskService,dialoguePanel);
        npc_0.showNpc(this.map);

        var npc_1 = new NPC("npc_1",taskService,dialoguePanel);
        npc_1.showNpc(this.map);

        var monster = new Monster("001",scenceService);
        monster.showMonster(this.map);

//任务和NPC和怪物结束


//人物面板部分
        var gem1 = new Gem("gem_0");
        var gem2 = new Gem("gem_1");
        var gem3 = new Gem("gem_2");

        var sword1 = new Weapon("weapon_0");
        var shield1 = new Shield("shield_0");
        var head1 = new Head("head_0");

        sword1.addGem(gem1);
        shield1.addGem(gem2);
        head1.addGem(gem3);

        var hero1 = new Hero("hero_0");

        var panel = new HeroPanel();

        hero1.equip(sword1);
        hero1.equip(shield1);
        hero1.equip(head1);

        panel.equipmentMap.equip(sword1);
        panel.equipmentMap.equip(shield1);
        panel.equipmentMap.equip(head1);

        hero1.reSetCurrentHMp();
        hero1.setInTeam(true);
        
        var user = new User();
        user.addHero(hero1);
        User.setHero(hero1);

        HeroPanel.setHeroPanel(panel);
        panel.setHero(hero1);

        infoScence.addChild(panel);

        
//人物面板结束

//命令系统相关

        var npcList:NPC[] = [];
        npcList.push(npc_0);
        npcList.push(npc_1);
        var monsterList:Monster[] = [];
        monsterList.push(monster);

        var commandService = new CommandService(this,gameScence,infoScence,this.map,player,npcList,monsterList,dialoguePanel,list);
        CommandService.setCurrentService(commandService);

        this.map.touchEnabled = true;
        this.map.addEventListener(egret.TouchEvent.TOUCH_TAP, commandService.onTouch, commandService);

//命令系统相关结束


    //this.addChild(infoScence);

    }

    /**
     * 根据name关键字创建一个Bitmap对象。name属性请参考resources/resource.json配置文件的内容。
     * Create a Bitmap object according to name keyword.As for the property of name please refer to the configuration file of resources/resource.json.
     */
    private createBitmapByName(name:string):egret.Bitmap {
        var result = new egret.Bitmap();
        var texture:egret.Texture = RES.getRes(name);
        result.texture = texture;
        return result;
    }

    /**
     * 描述文件加载成功，开始播放动画
     * Description file loading is successful, start to play the animation
     */
    private startAnimation(result:Array<any>):void {
        var self:any = this;

        var parser = new egret.HtmlTextParser();
        var textflowArr:Array<Array<egret.ITextElement>> = [];
        for (var i:number = 0; i < result.length; i++) {
            textflowArr.push(parser.parser(result[i]));
        }

        var textfield = self.textfield;
        var count = -1;
        var change:Function = function () {
            count++;
            if (count >= textflowArr.length) {
                count = 0;
            }
            var lineArr = textflowArr[count];

            self.changeDescription(textfield, lineArr);

            var tw = egret.Tween.get(textfield);
            tw.to({"alpha": 1}, 200);
            tw.wait(2000);
            tw.to({"alpha": 0}, 200);
            tw.call(change, self);
        };

        change();
    }

    /**
     * 切换描述内容
     * Switch to described content
     */
    private changeDescription(textfield:egret.TextField, textFlow:Array<egret.ITextElement>):void {
        textfield.textFlow = textFlow;
    }
}


