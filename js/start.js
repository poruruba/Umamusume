'use strict';

//var vConsole = new VConsole();
//const datgui = new dat.GUI();

var timer = null;

const QUIZ_STATUS = {
    IDLE : 0, // 開始前
    PREPARE: 1, // カウントダウン中
    WAITING : 2, // 宣告待ち
    INPUT: 3, // 回答待ち
    ANSWER: 4, // 降参
    CORRECT : 5, // 正解時
    MISS: 6, // 誤り時
};

var vue_options = {
    el: "#top",
    data: {
        progress_title: '', // for progress-dialog

        status: QUIZ_STATUS.IDLE,
        counting: 3,
        interval: 1000,
        QUIZ_STATUS: QUIZ_STATUS,
        quiz_image: null,
        quiz_select_list: [],
        quiz_select_index: 0,
        quiz_target: null,
        quiz_target_index: 0,
        start_tim: 0,
        answer_time: 0,
        record: null,

        NUM_OF_SELECT: 3,   // 選択肢の数
        PREPARE_COUNT : 3, // クイズ表示までのウェイト時間(秒)
        WAITING_DURATION: 5000, // 宣言待ち時間
        INPUT_DURATION: 3000, // 選択待ち時間
        RESULT_DURATION: 3000, // 結果表示時間
    },
    computed: {
    },
    methods: {
        quiz_select: function(index){
            if(this.status == QUIZ_STATUS.INPUT ){
                if( index == this.quiz_select_index )
                    this.process_status(QUIZ_STATUS.CORRECT);
                else
                    this.process_status(QUIZ_STATUS.MISS);
            }
        },
        quiz_start: function(){
            this.process_status(QUIZ_STATUS.PREPARE);
        },
        process_status: function(status){
            if( timer != null ){
                clearTimeout(timer);
                timer = null;
            }
            this.counting = -1;
            this.status = status;
            this.process();
        },
        process: function(){
            if( this.counting < 0 ){
                switch( this.status ){
                    // 状態遷移直後
                    case QUIZ_STATUS.PREPARE:{
                        this.counting = this.PREPARE_COUNT;
                        this.interval = 1000;
                        break;
                    }
                    case QUIZ_STATUS.WAITING:{
                        this.quiz_target_index = getRandomInt(quiz_contents.length);
                        this.quiz_target = quiz_contents[this.quiz_target_index];
                        this.quiz_image = this.quiz_target.blank_image;
                        this.start_tim = new Date().getTime();

                        this.counting = 1;
                        this.interval = this.WAITING_DURATION;
                        break;
                    }
                    case QUIZ_STATUS.INPUT:{
                        var select_list = [];
                        select_list.push(this.quiz_target.name.slice(-1));
                        while(select_list.length < this.NUM_OF_SELECT){
                            var c = quiz_contents[getRandomInt(quiz_contents.length)].name.slice(-1);
                            var index = select_list.findIndex(item => item == c);
                            if( index < 0 )
                                select_list.push(c);
                        }
                        this.quiz_select_index = getRandomInt(this.NUM_OF_SELECT);
                        var temp = select_list[0];
                        select_list[0] = select_list[this.quiz_select_index];
                        select_list[this.quiz_select_index] = temp;

                        this.quiz_select_list = select_list;

                        this.counting = 1;
                        this.interval = this.INPUT_DURATION;
                        break;
                    }
                    case QUIZ_STATUS.ANSWER:{
                        this.quiz_image = this.quiz_target.image;

                        this.counting = 1;
                        this.interval = this.RESULT_DURATION;
                        break;
                    }
                    case QUIZ_STATUS.CORRECT:{
                        this.answer_time = new Date().getTime() - this.start_tim;
                        this.message = "";
                        this.quiz_image = this.quiz_target.image;
                        this.record[this.quiz_target_index].correct++;
                        if( this.record[this.quiz_target_index].time <= 0 ){
                            this.record[this.quiz_target_index].time = this.answer_time;
                        }else
                        if( this.record[this.quiz_target_index].time > this.answer_time ){
                            this.record[this.quiz_target_index].time = this.answer_time;
                            this.message = "最短記録";
                            this.toast_show("最短記録です。");
                        }
                        Cookies.set('quiz_record', this.record, {expires: 365} );

                        this.counting = 1;
                        this.interval = this.RESULT_DURATION;
                        break;
                    }
                    case QUIZ_STATUS.MISS:{
                        this.quiz_image = this.quiz_target.image;
                        this.record[this.quiz_target_index].miss++;
                        Cookies.set('quiz_record', this.record, {expires: 365} );

                        this.counting = 1;
                        this.interval = this.RESULT_DURATION;
                        break;
                    }
                }
            }
            if( this.counting == 0 ){
                // タイムアウト発生
                switch( this.status ){
                    case QUIZ_STATUS.PREPARE:{
                        this.process_status(QUIZ_STATUS.WAITING);
                        break;
                    }
                    case QUIZ_STATUS.WAITING:{
                        this.process_status(QUIZ_STATUS.ANSWER);
                        break;
                    }
                    case QUIZ_STATUS.INPUT:{
                        this.process_status(QUIZ_STATUS.MISS);
                        break;
                    }
                    case QUIZ_STATUS.ANSWER:
                    case QUIZ_STATUS.CORRECT:
                    case QUIZ_STATUS.MISS:{
                        this.quiz_image = null;
                        this.process_status(QUIZ_STATUS.PREPARE);
                        break;
                    }
                }
                return;
            }
            if( this.counting >= 1 ){
                // タイムアウト待ち受け中
                this.counting--;
                timer = setTimeout(() =>{
                    this.process();
                }, this.interval);
            }
        },
        left_click: function(){
            if( this.status == QUIZ_STATUS.WAITING ){
                this.process_status(QUIZ_STATUS.INPUT);
            }else
            if( this.status == QUIZ_STATUS.INPUT ){
                this.process_status(QUIZ_STATUS.ANSWER);
            }
        },
        right_click: function(){
            if( this.status == QUIZ_STATUS.WAITING ){
                this.process_status(QUIZ_STATUS.ANSWER);
            }
        },
    },
    created: function(){
    },
    mounted: function(){
        proc_load();

        this.record = Cookies.getJSON('quiz_record');
        if( !this.record ){
            this.record = [];
            for( var i = 0 ; i < quiz_contents.length ; i++ ){
                this.record.push({
                    name: quiz_contents[i].name,
                    time: -1,
                    correct: 0,
                    miss: 0,
                });
            }
        }
    }
};
vue_add_methods(vue_options, methods_bootstrap);
vue_add_components(vue_options, components_bootstrap);
var vue = new Vue( vue_options );

function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
}