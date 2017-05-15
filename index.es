import React, {Component} from 'react'
import {connect} from 'react-redux'
import {createSelector} from 'reselect'

import {store} from 'views/create-store'

import {join} from 'path'
import {FormGroup, FormControl, ListGroup, ListGroupItem, Button, Row, Col, Table, ButtonGroup,OverlayTrigger,Tooltip} from 'react-bootstrap'


import {extensionSelectorFactory} from 'views/utils/selectors'
const fs = require('fs')
const zh = "阿八嚓哒妸发旮哈或讥咔垃麻拏噢妑七呥撒它拖脱穵夕丫帀坐".split('');
export const reactClass = connect(
  state => ({
    horizontal: state.config.poi.layout || 'horizontal',
    $ships: state.const.$ships,
    $shipTypes: state.const.$shipTypes,
    $slotitems: state.const.$equips,
    allmaps:state.fcd?state.fcd.map:{}
  }),
  null, null, {pure: false}
)(class PluginStatistic extends Component {

  constructor(props) {
    super(props)
    this.state = {
      ship_targets: this.simplfyship(),
      show_shipList: false,
      input_shipList: '',
      shipstatus:[],
      shipid:[],
      shipitems:[],
      shiphtml:''
    }
  }

  componentWillReceiveProps(nextProps) {

  }



  simplfyship() {
    try {
      var ships=this.simplfyship_D();
      var maps = [];
      var list = maps.concat(ships);
      return list;
    } catch (e) {
      console.log(e);
      try {
        return Object.keys(this.props.$ships);
      } catch (e2) {
        console.log(e2);
        return [];
      }
    }
  }

  simplfyship_D() {
    let $ships = this.props.$ships;
    for (let p in $ships) {
      let ship = $ships[p];
      let afterlv = ship.api_afterlv;
      let aftershipid = ship.api_aftershipid;
      if (afterlv && aftershipid) {
        let aftership = $ships[aftershipid];
        let aftership_beforeshipid = aftership.before_shipid;
        let aftership_beforeshiplv = aftership.before_shiplv;
        if (aftership_beforeshipid) {
          if (afterlv < aftership_beforeshiplv) {
            aftership.before_shipid = p;
            aftership.before_shiplv = afterlv;
          }
        } else {
          aftership.before_shipid = p;
          aftership.before_shiplv = afterlv;
        }
      }
    }
    let list = [];
    for (let p in $ships) {
      let ship = $ships[p];
      let afterlv = ship.api_afterlv;
      let aftershipid = ship.api_aftershipid;
      if (afterlv && aftershipid) {
        if (ship.before_shipid == undefined) {
          list.push(p);
        }
      }
    }
    list.sort(function (a, b) {
      return 8 * ($ships[a].api_stype - $ships[b].api_stype) + $ships[a].api_name.localeCompare($ships[b].api_name)
    });
    return list;
  }

  hiddenShipList = e => {
    e.preventDefault();
    e.stopPropagation();
    this.setState({show_shipList: false});
  };

  showShipList = e => {
    e.preventDefault();
    e.stopPropagation();
    this.setState({show_shipList: true, input_shipList: ''}, this.changeHandler(e, true));
  };

  changeHandler = (e, ...other) => {
    e.preventDefault();
    e.stopPropagation();
    let allship = [], $ship = this.props.$ships, expStr = e.target.value;
    if (other.length == 1 && other[0]) {
      expStr = ''
    }
    let lowstr = expStr.toLowerCase();
    this.simplfyship().map((id) => {
      var shipname;
      if(id.indexOf(":")>0){
        shipname=id;
      }else{
        shipname = $ship[id].api_name;
      }
      if(lowstr>='a'&&lowstr<='z'){
        var match=true;
        for(var i=0;i<lowstr.length;i++){
          var x=lowstr.charCodeAt(i)-97;
          var cs=zh[x];
          var ce=zh[x+1];
          if(shipname.charAt(i).localeCompare(cs)>0&&shipname.charAt(i).localeCompare(ce)<0){

          }else{
            match=false;
            break;
          }
        }
        if(match){
          allship.push(id);
        }
      }
      if (new RegExp(expStr, 'i').test(shipname))
        allship.push(id);
    });
    var itemkeys = Object.keys(this.props.$slotitems);
    itemkeys.map((id) => {
      var itemname = this.props.$slotitems[id].api_name;
      if(lowstr>='a'&&lowstr<='z'){
        var match=true;
        for(var i=0;i<lowstr.length;i++){
          var x=lowstr.charCodeAt(i)-97;
          var cs=zh[x];
          var ce=zh[x+1];
          if(itemname.charAt(i).localeCompare(cs)>0&&itemname.charAt(i).localeCompare(ce)<0){

          }else{
            match=false;
            break;
          }
        }
        if(match){
          allship.push(parseInt(id)+10000);
        }
      }
      if (new RegExp(expStr, 'i').test(itemname))
        allship.push(parseInt(id)+10000);
    });
    this.setState({ship_targets: allship, input_shipList: e.target.value})
  };

  selectShip = e => {
    e.stopPropagation();
    let $ships = this.props.$ships, option = e.currentTarget.value;
    if (option != 0) {
      this.setState({input_shipList: $ships[option].api_name});
    }
    this.handleFormChange(e,'ship');
  };

  selectItem = e => {
    e.stopPropagation();
    let $slotitems = this.props.$slotitems, option = e.currentTarget.value;
    if (option != 0) {
      this.setState({input_shipList: $slotitems[option].api_name});
    }
    this.handleFormChange(e,'item');
  };

  changeShip = e => {
    this.handleFormChange(e,'ship');
  }

  handleFormChange(e,type) {
    this.setState({
      searchShipId: e.currentTarget.value,
      searchType: type
    });
    if(type=='ship'){
      this.fetchShipData(e.currentTarget.value);
    }else{
      this.fetchItemData(e.currentTarget.value);
    }

  }

  fetchShipData(shipid){
    var $ships = this.props.$ships;
    var shipname = $ships[shipid].api_name;
    var url = "http://fleet.diablohu.com/ships/"+shipid+"/";
    var that=this;
    fetch(url).then(function(res){
      return res.text();
    }).then(function(response) {
      that.parseResponse(response);
    })
  }

  parseResponse(response){

    var n = response.indexOf('<main');
    var s1 = response.substring(n);
    var n1 = s1.indexOf('</main>');
    var s2 = s1.substring(0,n1+7);

    var keys = ['耐久','装甲','回避','搭载','火力','雷装','对空','对潜','航速','射程','索敌','运','油耗','弹耗'];
    var ret = keys.map(e => {
        return this.getElementsByHtml(s2,e);
    });
    var shipids = this.getAllShipId(s2);
    var equips = this.getEquips(s2);
    console.log(equips);
    this.setState({shipstatus:ret,shipid:shipids,shipitems:equips});
  }

  getElementsByHtml(htmlstr,key){
    var n = htmlstr.indexOf(key);
    if(key==-1){
      return 'unknown';
    }else{
      var s1 = htmlstr.substring(n+key.length);
      var n1 = s1.indexOf("<em");
      var s2 = s1.substring(n1+3);
      var n2 = s2.indexOf("</em>");
      var s3 = s2.substring(0,n2);
      if(s3.indexOf('</small>')>=0){
        var nw = s3.indexOf('</small>');
        var sw = s3.substring(0,nw);
        var np = sw.lastIndexOf('>');
        s3 = sw.substring(np+1);
      }
      var n3 = s3.lastIndexOf(">");
      var s4 = s3.substring(n3+1);
      if(key=='运'){
        var n4 = s3.indexOf('<sup');
        var s5 = s3.substring(0,n4);
        var n5 = s5.lastIndexOf('>');
        var s6 = s5.substring(n5+1);
        return s6;
      }else{
        return s4;
      }
    }
  }

  getAllShipId(htmlstr){
    var x = htmlstr;
    var indexstr = 'data-shipid="';
    var n = x.indexOf(indexstr);
    var ret = [];
    while(n>0){
      x=x.substring(n+indexstr.length);
      var m = x.indexOf('"');
      var id = x.substring(0,m);
      ret.push(id);
      n = x.indexOf(indexstr);
    }
    return ret;
  }

  getEquips(htmlstr){
    var n1 = htmlstr.indexOf('class="equipments"');
    var s1 = htmlstr.substring(n1);
    var item = [];
    for(var i=0;i<4;i++){
      var n = s1.indexOf('<a');
      var s2 = s1.substring(n+3);
      s1=s2;
      var equipid=0;
      var carry = 0;
      if(s2.startsWith('data-equipmentid="')){
        var s3 = s2.substring(18);
        var n3 = s3.indexOf('"');
        equipid = s3.substring(0,n3);
        var n4 = s3.indexOf('<em>');
        var n5 = s3.indexOf('</em>');
        carry = s3.substring(n4+4,n5);
      }else if(s2.startsWith('class="empty"')){
        var s3 = s2;
        var n4 = s3.indexOf('<em>');
        var n5 = s3.indexOf('</em>');
        equipid = 0;
        carry = s3.substring(n4+4,n5);
      }else if(s2.startsWith('class="no"')){
        equipid = -1;
        carry = -1;
      }
      var ret = equipid+"_"+carry;
      item.push(ret);
    }
    return item;
  }


  fetchItemData(itemid){
    var $slotitems = this.props.$slotitems;
    var itemname = $slotitems[itemid].api_name;
    var url = "https://zh.moegirl.org/"+encodeURIComponent("舰队")+"Collection:"+encodeURIComponent(itemname);
    var that=this;
    fetch(url).then(function(res){
      return res.text();
    }).then(function(response) {
      that.parseResponse(response);
    })
  }

  componentDidMount = () => {

  };


  render() {
    try {
      return this.render_D();
    } catch (e) {
      console.log(e);
      return (
        <div>
          unknown error
        </div>
      )
    }
  }



  render_D() {

    const createList = arr => {
      let out = [];
      arr.map((option) => {
        if(parseInt(option)<10000){
          const shipinfo = this.props.$ships[option],
            shipname = shipinfo.api_name,
            shiptypeid = shipinfo.api_stype,
            shiptypename = $shipTypes[shiptypeid].api_name;
          out.push(
            <li onMouseDown={this.selectShip} value={option}>
              <a>
                {shiptypename + ' : ' + shipname}
              </a>
            </li>
          )
        }else{
          var itemid = parseInt(option)-10000;
          const iteminfo = this.props.$slotitems[itemid];
          const itemname = iteminfo.api_name;
          out.push(
            <li onMouseDown={this.selectItem} value={itemid}>
              <a>
                {itemname}
              </a>
            </li>
          )
        }
      });
      return out;
    };
    var keys = ['耐久','装甲','回避','搭载','火力','雷装','对空','对潜','航速','射程','索敌','运','油耗','弹耗'];
    return(
      <div id="breed" className="breed">
        <link rel="stylesheet" href={join(__dirname, 'breed.css')}/>
        <Row>
          <Col xs={12}>
            <form className="input-select">
              <FormGroup>
                <FormControl type="text" placeholder="请选择" ref="shipInput" value={this.state.input_shipList}
                             onChange={this.changeHandler} onFocus={this.showShipList}
                             onBlur={this.hiddenShipList}/>
              </FormGroup>
              <ul className="ship-list dropdown-menu" style={{display: this.state.show_shipList ? 'block' : 'none'}}>
                {createList(this.state.ship_targets)}
              </ul>
            </form>
          </Col>
        </Row>
        <Row>
          <div>
            {
              keys.map((e,index)=>{
                return(
                  <div>
                    {e}:{this.state.shipstatus[index]}
                  </div>
                )
              })
            }
          </div>

          <div>
            {this.state.shipitems.map((e) =>{
              var itemid = e.split("_")[0];
              var carry = e.split("_")[1];
              var itemname;
              if(itemid==0){
                itemname="未装备";
              }else if(itemid==-1){
                itemname="不可装备";
              }else{
                itemname = this.props.$slotitems[itemid].api_name;
              }
              return(
                <div>
                  <Button value={itemid}>{itemname}</Button><span>搭载：{carry}</span>
                </div>
              )
            })}
          </div>
          <div>
            {this.state.shipid.map((e) =>{
              var afterlv = this.props.$ships[e].api_afterlv;
              return(
                <span>
                  <Button value={e} onClick={this.changeShip}>{this.props.$ships[e].api_name}</Button>
                  {afterlv>0?"lv."+afterlv:""}
                </span>
              )
            })}
          </div>
        </Row>
      </div>
    )
  }

});