// makeVtt.js をバージョンアップする。
// クラスを定義して、オブジェクト化する。

class Dlog {
    constructor() {
        this.raw = document.body.innerHTML; // .rawにパソコンテイクログ（html）のbody内容を取得。
        this.shaped = document.body.innerHTML; // .shaped のデータを加工していく。
        this.arr = {
            raw:[], 
            text:[], 
            time:[],
            offTime:[]
        }; //.shaped をsplitして作成した配列を .arr に格納する。 .arrはオブジェクトとする。
        this.timeSlide = Number(0); // 動画再生から字幕がスタートする時間をずらすためのパラメータ。単位はミリ秒。
    }

    replaceTouten(){
        this.shaped = this.shaped.replace(/、/g, '　');
        console.log(this.shaped)
    }

    insertN(){
        // <br>のみが<span>タグに挟まれている部分を抜き出すための正規表現を設定。
        var reg_br = /<span timestamp="\d\d\d\d\d\d\d\d\d\d\d\d\d"><br><\/span>/g;
        //改行部分の記録を'\n'に置き換える。
        this.shaped = this.shaped.replace(reg_br, '\n');
        
        // </span>のすぐあとに<span...>で始まる部分を抽出して，間に"\n"を入れる。
        var reg_end_span = /<\/span><span/g;
        //改行部分の記録を"\n"に置き換える。
        this.shaped = this.shaped.replace(reg_end_span, "<\/span>\n<span");

        //<br>タグを取り除く。
        this.shaped = this.shaped.replace(/<br>/g, "");

        console.log(this.shaped);
    }

    shape(){
        this.replaceTouten();
        this.insertN();
    }

    makeArr() {
        // '\n'に置き換えた部分を区切りとして、.shapedを配列「.arr」に格納する。
        this.arr.raw = this.shaped.split('\n');
        
        // "" の要素以外の要素を格納する。
        this.arr.raw = this.arr.raw.filter(n => n != "");

        //配列からテキストを取り出して .arr に格納。
        this.arr.text = Array.from(this.arr.raw, i => i.replace(/<\/span>/g, ''));
        this.arr.text = Array.from(this.arr.text, i => i.replace(/<span.*>/g, ''));
        // console.log(dlog_arr_text);

        //配列から時刻を取り出す。
        var reg_time = /\d\d\d\d\d\d\d\d\d\d\d\d\d/;
        this.arr.time = Array.from(this.arr.raw, i => Number(i.match(reg_time)));
        // console.log(dlog_arr_time);

        console.log(this.arr);

    }

    // .arr.timeに格納された時間の時系列をチェックするメソッド。
    checkTime() {
        var iregTime = [];
        for (var i = 0; i < (this.arr.time.length - 1); i++){
            if(this.arr.time[i] < this.arr.time[i+1]){
                console.log("true");
            } else{
                console.log("false");
                iregTime.push(i);
            }
        }

        if (iregTime > 0) {
            console.log("check iregTime below:\n", iregTime);
            return iregTime;
        } else {
            console.log("OK! no iregTime found.");
            return true;
        }

    }

    //取り出した時刻の配列の要素それぞれに、オフセット時刻を差し引いて計算する関数を定義する。
    //オフセット時刻は、配列の一番最初の時刻を設定する想定とする。
    getTimeOffset(timeSlide=0) {
        this.arr.offTime = Array.from(this.arr.time, i => i - this.arr.time[0]);
        this.arr.offTime = Array.from(this.arr.offTime, i => i + timeSlide);
        return this.arr.offTime;
    }


}

var dlog = new Dlog();


//ミリ秒表記を「hh:mm:ss.000」の形式に整える関数を定義する。
function getTimeFormated(time_ms){
    var fms = time_ms % 1000; //1000で割った余りをmsとする。

    var fsec = Math.floor(time_ms/1000); //1000で割った商を仮にfsecとする。

    var fmin = Math.floor(fsec/60); //fsecを60で割った商を仮にfminとする。
    fsec = fsec % 60; //60で割った余りをfsecに再設定する。

    var fhour = Math.floor(fmin/60); //fminを60で割った商をfhourとする。
    fmin = fmin % 60; //60で割った余りをfminに再設定する。

    fhour_str = ("00" + fhour).slice(-2);
    fmin_str = ("00" + fmin).slice(-2);
    fsec_str = ("00" + fsec).slice(-2);
    fms_str = ("000" + fms).slice(-3);

    return fhour_str + ":" + fmin_str + ":" + fsec_str + "." + fms_str;
}


dlog.shape(); // dlog を整形する。
dlog.makeArr(); // 配列に格納する。

// dlog.arr.time に格納された時間の時系列をチェックする。
if(dlog.checkTime()){
    dlog.timeSlide = Number(window.prompt("動画開始からずらす時間を入力してください（単位：ミリ秒）", 0));
    dlog.getTimeOffset(timeSlide = dlog.timeSlide);

    //オフセットされた時刻の配列からvtt形式の時刻文字列を得る。
    timeOffset_arr_from = Array.from(dlog.arr.offTime);
    timeOffset_arr_to =  Array.from(dlog.arr.offTime);

    timeOffset_arr_to.push(timeOffset_arr_to[timeOffset_arr_to.length-1] + (1000 * 5)) // 配列の最後の時刻に5秒（5000ミリ秒）を加えたものを、最後に加える。
    timeOffset_arr_to.shift() //先頭の要素を削除する。

    var vtt = "WEBVTT" + "\n\n\n";

    for (var i = 0; i < (timeOffset_arr_from.length); i++){

        if (i % 10 == 0){
            vtt += getTimeFormated(timeOffset_arr_from[i]) + " --> " + getTimeFormated(timeOffset_arr_to[i]) + "\n";
            vtt += "【注意事項: 聴覚障害のある学生向けの字幕です。言い換え・省略等が含まれています。】\n" + dlog.arr.text[i] + "\n\n";
        } else if (i % 10 != 0){
            vtt += getTimeFormated(timeOffset_arr_from[i]) + " --> " + getTimeFormated(timeOffset_arr_to[i]) + "\n";
            vtt += dlog.arr.text[i] + "\n\n";
        }

    }

    vtt += "\n\n"

    console.log(vtt);

} else{
    console.log("時間データの並びが不正です。処理を中断します。")
}



