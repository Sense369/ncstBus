// pages/bus/bus.js
const app = getApp()

Page({
  data: {
    curDate: '', //当前日期
    startDate: '', //开始售票日期
    endDate: '', //最后预售日期
    curTime: '00:00', //当前时间
    curWeek: '周一',
    curYear: 2020,
    font_left_ocp: 0.2,
    font_right_ocp: 1,
    ncst: [],
    tsxz: [],
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function () {
    console.log('onLoad')
    var timeStamp = Date.parse(new Date()) + 60 * 60 * 1000 * 8; // 东八区 北京时间戳
    var curDataTime = new Date(timeStamp).toJSON()
    var curDate = curDataTime.substring(0, 10); // 当前日期 YYYY-MM-DD

    this.setData({
      curDate: curDate,
      startDate: curDate,
      endDate: new Date(timeStamp + 60 * 60 * 1000 * 24 * 10).toJSON().substring(0, 10), // 10天后
      curTime: curDataTime.substring(11, 16), // 当前时间 hh:mm
      // curTime: '18:55',
      curYear: curDataTime.substring(0, 4),
    })
    this.updateWeek(curDate)
    console.log('curDate:', curDate)
  },


  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: async function () {
    console.log('onReady')
    this.updateBus(this.data.curDate)
  },


  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    console.log('onShow')
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
    console.log('onHide')
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
    console.log('onUnload')
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
    console.log('onPullDownRefresh')
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
    console.log('onReachBottom')
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
    console.log('onShareAppMessage')
  },

  // 日期更改-Button按钮
  dateChangeButton: function (e) {
    // ios不支持yyyy-mm-dd，支持yyyy/mm/dd
    var ios_timestamp = Date.parse(this.data.curDate.replace(/-/g, '/')) + 60 * 60 * 1000 * 8
    var newDate = new Date(ios_timestamp + e.target.dataset.value * 24 * 60 * 60 * 1000).toJSON().substring(0, 10)
    if (newDate >= this.data.startDate && newDate <= this.data.endDate) {
      this.dateChange(newDate)
    }
  },
  // 日期更改-Picker选择器
  dateChangePicker: function (e) {
    this.dateChange(e.detail.value)
  },
  // 日期更改
  dateChange: function (date) {
    if (date != this.data.curDate) {
      this.setData({
        curDate: date
      })
      this.updateBus(date) // 更新bus数据
      this.updateWeek(date) // 更新周几
      this.changeBtnOcp() // 更改按钮透明度
    }
  },

  // 更改日期按钮透明度
  changeBtnOcp() {
    if (this.data.curDate == this.data.endDate) {
      this.setData({
        font_left_ocp: 1,
        font_right_ocp: 0.2,
      })
    } else if (this.data.curDate == this.data.startDate) {
      this.setData({
        font_left_ocp: 0.2,
        font_right_ocp: 1,
      })
    } else {
      this.setData({
        font_left_ocp: 1,
        font_right_ocp: 1,
      })
    }
  },

  updateBus: async function (date) {
    // 同步函数
    await this.getBusTime(date).then((bus_json) => {
      console.log('bus_json:', bus_json)
      if (bus_json) {
        if (date == this.data.startDate) {
          // 只有今天更新bus动画json
          this.updateBusJson(bus_json);
        } else {
          // 其他日期只显示发车时间
          this.setData({
            ncst: bus_json['ncst'],
            ts: bus_json['ts']
          })
        }
      }
    });
  },

  // 获取发车时间 bus_date:YYYY-MM-DD
  async getBusTime(bus_date) {
    console.log('bus_date:', bus_date)
    var that = this;
    return new Promise(function (resolve, reject) {
      wx.request({
        url: 'https://213775z82x.goho.co/bus',
        data: {
          date: bus_date
        },
        header: {
          'content-type': 'application/json'
        },
        method: 'GET',
        dataType: 'json',
        success: (res) => {
          if (res.data == 'Internal Server Error') {
            console.log('failed:', res.data)
            var endDate = new Date(Date.parse(bus_date) - 24 * 60 * 60 * 1000).toJSON().substring(0, 10)
            that.setData({
              curDate: endDate,
              endDate: endDate,
            })
            that.updateBus(endDate)
            that.updateWeek(endDate)
          } else {
            resolve(JSON.parse(res.data))
          }
        },
        fail(err) {
          reject(err)
        }
      })
    })
  },

  // 更新bus动画的json
  updateBusJson(bus_json) {
    var bus_json_new = {
      "ncst": [],
      "ts": []
    }
    for (var key in bus_json_new) {
      for (let i = 0; i < bus_json[key].length; i++) {
        var bus_minute = bus_json[key][i].time;
        var bus_timestamp = Date.parse(this.data.curDate.replace(/-/g, '/') + ' ' + bus_minute);
        var now_timestamp = Date.parse(new Date()); 
        // var now_timestamp = Date.parse(new Date('2023/05/30 18:55:10'));
        var minute_diff = parseInt((bus_timestamp - now_timestamp) / 60000); // 时间差(分钟)
        if (minute_diff < 0) {
          var color = '#cccccc'
        } else if (minute_diff <= 30) {
          var color = 'red'
        } else {
          var color = '#000000'
        }
        // 动画滑动距离: left百分比
        if (key == 'ncst') {
          var bus_left = parseInt(-minute_diff / 75 * 87);
        } else if (key == 'ts') {
          var bus_left = 87 - parseInt(-minute_diff / 75 * 87);
        }
        // 拼装新bus_json
        bus_json_new[key][i] = {
          "time": bus_minute,
          "minute_diff": minute_diff,
          "color": color,
          "bus_left": bus_left
        }
      }
      console.log(bus_json_new)
      this.setData({
        ncst: bus_json_new['ncst'],
        ts: bus_json_new['ts'],
      })
    }
  },


  // 更新：日期(周几)
  updateWeek(date) {
    let weekArrar = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    let week = weekArrar[new Date(date).getDay()]
    this.setData({
      curWeek: week
    })
  },
})