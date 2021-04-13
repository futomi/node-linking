node-linking
===============

[[English (英語)](README.md)]

node-linking は、Linking Project (NTTドコモ) によって開発された Linking プロファイルをサポートした BLE デバイスにアクセスするための Node.js モジュールです。

[Linking プロファイル](https://linkingiot.com/developer/api.html)とは、LED、ボタン、センサーなどの IoT デバイスに使われる BLE プロファイルです。すでに日本国内ではいくつかの [Linking デバイス](https://linkingiot.com/developer/devices.html)が販売されています。

node-linking は、簡単に Linking デバイスにアクセスするための API を提供します。Linking プロファイルを詳細に覚える必要はありません。

## サポート OS

node-linking は、Raspbian や Ubuntu など Linux ベースの OS で動作します。残念ながら、Windows や Mac OS では動作しません。

## 依存関係

* [Node.js](https://nodejs.org/en/) 12s +
* [@abandonware/noble](https://github.com/abandonware/noble)

[@abandonware/noble](https://github.com/abandonware/noble) のインストール方法については、[@abandonware/noble](https://github.com/abandonware/noble) のドキュメントを参照してください。

noble はほとんどの Linux 環境では root 権限でないと動作しません。詳細は [@abandonware/noble](https://github.com/abandonware/noble) のドキュメントを参照してください。

このモジュールの以前のバージョンでは BLE 操作のために [noble](https://github.com/sandeepmistry/noble) に依存していました。しかし [noble](https://github.com/sandeepmistry/noble) は Node v10 以降をサポートしていないようです。現在、このモジュールは、[noble](https://github.com/sandeepmistry/noble) からフォークされた [@abandonware/noble](https://github.com/abandonware/noble) を採用しています。下位互換性のために、このモジュールは、Node v8 以前の環境では [noble](https://github.com/sandeepmistry/noble) がインストールされた環境でも、これまで通り動作します。

## インストール

```
$ cd ~
$ npm install @abandonware/noble
$ npm install node-linking
```

---------------------------------------
## 目次

* [クイックスタート](#Quick-Start)
  * [Linking デバイスの発見と接続](#Quick-Start-1)
  * [ボタンアクションの検知](#Quick-Start-2)
  * [センサーデータの検知](#Quick-Start-3)
  * [LED の ON と OFF](#Quick-Start-4)
* [`Linking` オブジェクト](#Linking-object)
  * [init() メソッド](#Linking-init-method)
  * [discover(*[params]*) メソッド](#Linking-discover-method)
  * [`ondiscover` イベントハンドラ](#Linking-ondiscover-event-handler)
  * [scartScan(*[params]*) メソッド](#Linking-startScan-method)
  * [stopScan() メソッド](#Linking-stopScan-method)
  * [`onadvertisement` イベントハンドラ](#Linking-onadvertisement-event-handler)
  * [`wait()` method](#Linking-wait-method)
* [`LinkingDevice` オブジェクト](#LinkingDevice-object)
  * [connect() メソッド](#LinkingDevice-connect-method)
  * [disconnect() メソッド](#LinkingDevice-disconnect-method)
  * [プロパティ](#LinkingDevice-properties)
  * [`onconnect` イベントハンドラ](#LinkingDevice-onconnect-event-handler)
  * [`ondisconnect` イベントハンドラ](#LinkingDevice-ondisconnect-event-handler)
* [`LinkingAdvertisement` オブジェクト](#LinkingAdvertisement-object)
* [`LinkingServices` オブジェクト](#LinkingServices-object)
* [`LinkingDeviceName` オブジェクト](#LinkingDeviceName-object)
  * [get() メソッド](#LinkingDeviceName-get-method)
  * [set() メソッド](#LinkingDeviceName-set-method)
* [`LinkingBattery` オブジェクト](#LinkingBattery-object)
  * [start() メソッド](#LinkingBattery-start-method)
  * [`onnotify` プロパティ](#LinkingBattery-onnotify-property)
  * [stop() メソッド](#LinkingBattery-stop-method)
* [`LinkingLed` オブジェクト](#LinkingLed-object)
  * [`LinkingLedColors` オブジェクト](#LinkingLedColors-object)
  * [`LinkingLedPatterns` オブジェクト](#LinkingLedPatterns-object)
  * [turnOn() メソッド](#LinkingLed-turnOn-method)
  * [turnOff() メソッド](#LinkingLed-turnOff-method)
* [`LinkingVibration` オブジェクト](#LinkingVibration-object)
  * [`LinkingVibrationPatterns` オブジェクト](#LinkingVibrationPatterns-object)
  * [turnOn() メソッド](#LinkingVibration-turnOn-method)
  * [turnOff() メソッド](#LinkingVibration-turnOff-method)
* [`LinkingButton` オブジェクト](#LinkingButton-object)
  * [`onnotify` プロパティ](#LinkingButton-onnotify-property)
* [`LinkingGyroscope` オブジェクト](#LinkingGyroscope-object)
  * [start() メソッド](#LinkingGyroscope-start-method)
  * [`onnotify` プロパティ](#LinkingGyroscope-onnotify-property)
  * [stop() メソッド](#LinkingGyroscope-stop-method)
  * [get() メソッド](#LinkingGyroscope-get-method)
* [`LinkingAccelerometer` オブジェクト](#LinkingAccelerometer-object)
  * [start() メソッド](#LinkingAccelerometer-start-method)
  * [`onnotify` プロパティ](#LinkingAccelerometer-onnotify-property)
  * [stop() メソッド](#LinkingAccelerometer-stop-method)
  * [get() メソッド](#LinkingAccelerometer-get-method)
* [`LinkingOrientation` オブジェクト](#LinkingOrientation-object)
  * [start() メソッド](#LinkingOrientation-start-method)
  * [`onnotify` プロパティ](#LinkingOrientation-onnotify-property)
  * [stop() メソッド](#LinkingOrientation-stop-method)
  * [get() メソッド](#LinkingOrientation-get-method)
* [`LinkingTemperature` オブジェクト](#LinkingTemperature-object)
  * [start() メソッド](#LinkingTemperature-start-method)
  * [`onnotify` プロパティ](#LinkingTemperature-onnotify-property)
  * [stop() メソッド](#LinkingTemperature-stop-method)
* [`LinkingHumidity` オブジェクト](#LinkingHumidity-object)
  * [start() メソッド](#LinkingHumidity-start-method)
  * [`onnotify` プロパティ](#LinkingHumidity-onnotify-property)
  * [stop() メソッド](#LinkingHumidity-stop-method)
* [`LinkingPressure` オブジェクト](#LinkingPressure-object)
  * [start() メソッド](#LinkingPressure-start-method)
  * [`onnotify` プロパティ](#LinkingPressure-onnotify-property)
  * [stop() メソッド](#LinkingPressure-stop-method)
* [`LinkingHuman` オブジェクト](#LinkingHuman-object)
  * [start() メソッド](#LinkingHuman-start-method)
  * [`onnotify` プロパティ](#LinkingHuman-onnotify-property)
  * [stop() メソッド](#LinkingHuman-stop-method)
* [`LinkingIlluminance` オブジェクト](#LinkingIlluminance-object)
  * [start() メソッド](#LinkingIlluminance-start-method)
  * [`onnotify` プロパティ](#LinkingIlluminance-onnotify-property)
  * [stop() メソッド](#LinkingIlluminance-stop-method)
* [対応デバイス](#Supported-devices)
* [リリースノート](#Release-Note)
* [リファレンス](#References)
* [ライセンス](#License)

---------------------------------------
## <a id="Quick-Start">クイックスタート</a>

### <a id="Quick-Start-1">Linking デバイスの発見と接続</a>

このサンプルコードは、Linking デバイスの発見、接続、切断の方法を示しています。また、このコードは、デバイス名の取得方法、対応サービスの確認方法も示しています。

```JavaScript
// node-inking をロードし、`Linking` コンストラクタオブジェクトを取得
const Linking = require('node-linking');
// `Linking` オブジェクトを生成
const linking = new Linking();

(async () => {
  // `LinkingDevice` オブジェクトを初期化
  await linking.init();

  // 名前が `Tukeru` で始まるデバイスを 5 秒間発見を試みる
  let device_list = await linking.discover({
    duration: 5000,
    nameFilter: 'Tukeru'
  });

  if (device_list.length === 0) {
    console.log('No device was found.');
    return;
  }

  // 発見したデバイスを表す `LinkingDevice` オブジェクト
  let device = device_list[0];

  // デバイス名
  let name = device.advertisement.localName;
  console.log('`' + name + '` was found.');

  // デバイスに接続
  console.log('Connecting to `' + name + '`...');
  await device.connect();
  console.log('Connected.');

  // 対応サービスを表示
  console.log('This device suports:');
  for (let [name, service] of Object.entries(device.services)) {
    if (service) {
      console.log('- ' + name);
    }
  }

  // デバイスを切断
  console.log('Disconnecting...');
  await device.disconnect();
  console.log('Disconnected');
  process.exit();
})();
```

まず、`Linking` コンストラクタオブジェクトから [`Linking`](#Linking-object) オブジェクトを生成しなければいけません。上記コードでは、変数 `linking` が [`Linking`](#Linking-object) オブジェクトに相当します。

[`init()`](#Linking-init-method) メソッドを呼び出すと、[`Linking`](#Linking-object) オブジェクトが利用可能な状態になります。このメソッドの呼び出しを忘れないようにしてください。なお、[`Linking`](#Linking-object) に実装された非同期型のメソッドは、`Promise` オブジェクトを返します。

[`Linking`](#Linking-object) オブジェクトの [`discover()`](#Linking-discover-method) メソッドは、Linking デバイスを発見します。このメソッドは 2 つのパラメータを第一引数に与えることができます (いずれのパラメータもオプショナル)。上記コードは、5 秒間 (5,000 ミリ秒) だけ発見処理を行い、名前が `Tukeru` で始まるデバイスを発見します。

上記コードでは、変数 `device` が発見されたデバイスを表す [`LinkingDevice`](#LinkingDevice-object) オブジェクトです。該当のデバイスの名前は、[`LinkingDevice.advertisement.localName`](#LinkingAdvertisement-object) プロパティから得られます。

この時点では、まだ該当のデバイスを操作することはできません。そのためには [`connect()`](#LinkingDevice-connect-method) メソッドを呼び出さなければいけません。このメソッドは、さらに、デバイスの種類やサポートしているサービスなどを調べます。その処理に 10 秒程度かかります。

一度デバイスと接続したら、サポートしているすべてのサービスを呼び出すことができるようになります。[`LinkingDevice.services`](#LinkingServices-object) プロパティから、サポートしているサービスを知ることができます。

上記サンプルコードは、次のような結果を出力します：

```
`Tukeru_th0164271` was found.
Connecting to `Tukeru_th0164271`...
Connected.
This device suports:
- deviceName
- led
- battery
- temperature
- humidity
Disconnecting...
Disconnected
```

ご覧の通り、このデバイスは、`led`, `vibrations`, `temperature` など様々なサービスをサポートしています。

最後に、[`disconnect()`](#LinkingDevice-disconnect-method) メソッドを使ってデバイスを切断します。このプロセスも非同期で、`Promise` オブジェクトを返します。

### <a id="Quick-Start-2">ボタンアクションの検知</a>

"Pochiru" のように、いくつかの Linking デバイスにはボタンが組み込まれています。そういったデバイスのために、Linking プロファイルはボタンアクションの通知をサポートしています。以下のコードは、ボタンアクションの検知の方法を示しています。

```JavaScript
const Linking = require('node-linking');
const linking = new Linking();

(async () => {
  await linking.init();
  let device_list = await linking.discover({
    duration: 5000,
    nameFilter: 'Pochiru'
  });
  if (device_list.length === 0) {
    console.log('No device was found.');
    return;
  }

  let device = device_list[0];
  let name = device.advertisement.localName;
  console.log('`' + name + '` was found:');

  console.log('Connecting to `' + name + '`...');
  await device.connect();
  console.log('Connected.');

  // button サービスをサポートしているかをチェック
  if (device.services.button) {
    // デバイスから通知が送られてくるたびに呼び出される関数をセット
    device.services.button.onnotify = (res) => {
      console.log(JSON.stringify(res, null, '  '));
    };
    console.log('Now listening to the button event.');
    await linking.wait(30000);
  }

  await device.disconnect();
  console.log('Disconnected');

  process.exit();
})();
```

もしボタンアクションを監視したいなら、`LinkingDeivce.services.button` プロパティをチェックすることをお勧めします。もしデバイスが button サービスをサポートしているなら、そこに [`LinkingButton`](#LinkingButton-object) オブジェクトがセットされます。そのオブジェクトには、デバイスのボタンアクションのための API が用意されています。もしデバイスが button サービスをサポートしていないなら、`null` がセットされます。

デバイスのボタンアクションを監視するためには、[`onnotify`](#LinkingButton-onnotify-property) プロパティにコールバック関数をセットしなければいけません。これは、デバイスから通知が来るたびに呼び出されます。

上記コードは次のような結果を出力します：

```
{
  "buttonId": 2,
  "buttonName": "SingleClick"
}
{
  "buttonId": 4,
  "buttonName": "DoubleClick"
}
{
  "buttonId": 7,
  "buttonName": "LongClick"
}
{
  "buttonId": 9,
  "buttonName": "LongClickRelease"
}
```

Linking プロファイルは、様々なボタンアクションをサポートしています。ご覧の通り、シングルクリック、ダブルクリック、長押しなど、デバイスでどんな種類のボタンアクションが発生したのかを区別することができます。

### <a id="Quick-Start-3">センサーデータの検知</a>

このサンプルコードは、センサーの通知を開始する方法、デバイスから送られて来るセンサーデータのモニター方法を示しています。このコードでは、変数 `device` が、該当のデバイスを表す [`LinkingDevice`](#LinkingDevice-object) です。

以下のコードはデバイス接続後でないと動作しない点に注意してください。

```JavaScript
const Linking = require('node-linking');
const linking = new Linking();

(async () => {
  await linking.init();
  let device_list = await linking.discover({
    duration: 5000,
    nameFilter: 'Tukeru'
  });
  if (device_list.length === 0) {
    console.log('No device was found.');
    return;
  }

  let device = device_list[0];
  let name = device.advertisement.localName;
  console.log('`' + name + '` was found:');

  console.log('Connecting to `' + name + '`...');
  await device.connect();
  console.log('Connected.');
  console.log('------------------------------------------------');

  // デバイスが temperature サービスをサポートしているかをチェック
  if (device.services.temperature) {
    // デバイスから通知が来たら呼び出される関数をセット
    device.services.temperature.onnotify = (res) => {
      console.log(res.temperature + ' °C');
    };

    // 通知を開始
    console.log('Starting to listen to notifications.');
    await device.services.temperature.start();
    console.log('Now listening to notifications.');

    // 10 秒待つ
    await linking.wait(10000);

    // 通知を停止
    await device.services.temperature.stop();
    console.log('Stopped to listen to notifications.');
  }

  await device.disconnect();
  console.log('Disconnected');

  process.exit();
})();
```

もし温度センサーのデータを監視したいなら、`LinkingDeivce.services.temperature` プロパティをチェックすることをお勧めします。もしデバイスが temperature サービスをサポートしているなら、そこに [`LinkingTemperature`](#LinkingTemperature-object) オブジェクトがセットされます。そのオブジェクトには、デバイスの温度センサーに関する API が用意されています。もしデバイスが temperature サービスをサポートしていないなら、`null` がセットされます。

通知を開始する前に、[`onnotify`](#LinkingTemperature-onnotify-property) プロパティにコールバック関数をセットしなければいけません。デバイスから通知が来るたびに、この関数が呼び出されます。

button サービスとは違い、[`start()`](#LinkingTemperature-start-method) メソッドを呼び出さなければいけません。問題なく通知を開始できたら、温度が変化する都度、`onnotify` プロパティにセットされた関数が呼び出されます。

[`LinkingTemperature`](#LinkingTemperature-object) オブジェクトの [`stop()`](#LinkingTemperature-stop-method) メソッドは、通知を停止します。通知が必要ないときは、このメソッドを呼び出すことをお勧めします。でなければ、バッテリーを無駄に消費してしまいます。

上記コードは次のような結果を出力します：

```
Starting to listen to notifications.
Now listening to notifications.
27.25 °C
Stpped to listen to notifications.
Disconnected
```

### <a id="Quick-Start-4">LED の ON と OFF</a>

ほとんどの Linking デバイスには LED が装備されています。Linking プロファイルはデバイスの LED の ON/OFF をサポートしています。下記コードは、色とパターンを使って LED の点灯や消灯の方法を示しています。

```JavaScript
const Linking = require('node-linking');
const linking = new Linking();

(async () => {
  await linking.init();
  let device_list = await linking.discover({
    duration: 5000,
    nameFilter: 'Tukeru'
  });
  if (device_list.length === 0) {
    console.log('No device was found.');
    return;
  }
  let device = device_list[0];
  let name = device.advertisement.localName;
  console.log('`' + name + '` was found:');

  console.log('Connecting to `' + name + '`...');
  await device.connect();
  console.log('Connected.');

  // デバイスが LED サービスをサポートしているかをチェック
  if (device.services.led) {
    // サポートされている色を表示
    console.log('- Supported colors:');
    Object.keys(device.services.led.colors).forEach((color) => {
      console.log('  - ' + color);
    });

    // サポートされているパターンを表示
    console.log('- Supported patterns:');
    Object.keys(device.services.led.patterns).forEach((pattern) => {
      console.log('  - ' + pattern);
    });

    // LED 点灯
    await device.services.led.turnOn('Red', 'Pattern1');
    console.log('The LED was turned on');

    // 5秒待つ
    await linking.wait(5000);

    // LED 消灯
    await device.services.led.turnOff();
    console.log('The LED was turned off');
  }

  await device.disconnect();
  console.log('Disconnected');

  process.exit();
})();
```

LED を点灯または消灯したい場合は、`LinkingDeivce.services.led` プロパティをチェックすることをお勧めします。もしデバイスが LED サービスをサポートしていれば、この値には [`LinkingLed`](#LinkingLed-object) オブジェクトがセットされます。そのオブジェクトには、デバイスの LED に関する API が用意されています。LED サービスがサポートされていなければ、`null` がセットされます。

[`LinkingLed.colors`](#LinkingLedColors-object) から対応色を、[`LinkingLed.patterns`](#LinkingLedPatterns-object) から対応パターンを知ることができます。

[`LinkingLed`](#LinkingLed-object) オブジェクトの [`turnOn()`](#LinkingLed-turnOn-method) メソッドを呼び出すと、該当の LED が点灯します。[`turnOff()`](#LinkingLed-turnOff-method) メソッドを呼び出すと、該当の LED が消灯します。

[`turnOn()`](#LinkingLed-turnOn-method) メソッドには、色とパターンを引き渡すことができます。上記コードを実行すると、[`turnOff()`](#LinkingLed-turnOff-method) メソッドが呼び出されるまで、LED が赤色で点灯します。

上記コードは、次のような結果を出力します：

```
- Supported colors:
  - Red
  - Green
- Supported patterns:
  - OFF
  - Pattern1
  - Pattern2
  - Pattern3
  - Pattern4
  - Pattern5
  - Pattern6
The LED was turned on
The LED was turned off
```

---------------------------------------
## <a id="Linking-object">`Linking` オブジェクト</a>

node-linking を使うためには、次のように、node-linking モジュールをロードしなければいけません：

```JavaScript
const Linking = require('node-linking');
```

上記コードから `Linking` コンストラクタが得られます。その後、次のように、`Linking` コンストラクタから `Linking` オブジェクトを生成しなければいけません：

```JavaScript
const linking = new Linking();
```

`Linking` コンストラクタはオプションで一つの引数を取ります。それは、次のプロパティを含んだハッシュオブジェクトでなければいけません：

プロパティ | 型    | 必須 | 説明
:---------|:------|:-----|:-----------
`noble`   | Noble | 任意 | [`noble`](https://www.npmjs.com/package/noble) モジュールの `Noble` オブジェクト

node-linking モジュールは、BLE で Linking デバイスを操作するために、[`noble`](https://www.npmjs.com/package/noble) を使います。noble モジュールを使って他の BLE デバイスを操作したいなら、自身で `Noble` オブジェクトを生成して、それをこのモジュールに引き渡すことができます。もし `noble` プロパティに `Noble` オブジェクトを指定しなかったら、このモジュールは自動的に `Noble` オブジェクトを内部的に生成します。

下記サンプルコードは、`Linking` コンストラクタに `Noble` オブジェクトを引き渡す方法を示しています：

```JavaScript
// NOble オブジェクトを生成
const noble = require('noble');

// Linking オブジェクトを生成
const Linking = require('node-linking');
const linking = new Linking({'noble': noble});
```

上記コードでは、変数 `Linking` が `Linking` オブジェクトを表しています。`Linking` オブジェクトは、以降の章で説明するメソッドを持っています。

### <a id="Linking-init-method">init() メソッド</a>

`Linking` オブジェクトは当初は利用することができません。以下のように、`init()` メソッドを使って初期化しなければいけません：

```JavaScript
linking.init().then(() => {
  // `Linking` オブジェクトに実装されたメソッドを呼び出すことができます。
}).catch((error) => {
  console.error(error);
});
```

`init()` メソッドは `Promise` オブジェクトを返します。`Linking` オブジェクトが初期化されれば、以降の章で説明するメソッドを呼び出すことができるようになります。

### <a id="Linking-discover-method">discover(*[params]*) メソッド</a>

`discover` メソッドは、Linking デバイスを発見します。このメソッドは `Promise` オブジェクトを返します。このメソッドは、次の通りのパラメータを含んだハッシュオブジェクトを引数に取ります：

プロパティ    | 型      | 必須 | 説明
:------------|:--------|:-----|:------------
`duration`   | Number  | 任意 | 発見処理の時間 (ミリ秒)。デフォルト値は 5000 (ミリ秒) です。
`nameFilter` | String  | 任意 | この値が指定されると、名前 (`localName`) が指定のキーワードで始まらないデバイスを無視します。
`idFilter`   | String  | 任意 | この値が指定されると、ID (`id`) が指定のキーワードで始まらないデバイスを無視します。
`quick`      | Boolean | 任意 | この値が `true` なら、このメソッドは、最初のデバイスが発見されたときに発見処理を終了し、指定の `duration` を待つことなく、`resolve()` 関数を呼び出します。デフォルト値は `false` です。

下記コードでは、`duration` と `nameFilter` が `discover()` メソッドに引き渡されています：

```JavaScript
linking.init().then(() => {
  return linking.discover({
    duration: 5000,
    nameFilter: 'Pochiru'
  });
}).then((device_list) => {
  // Do something...
}).catch((error) => {
  console.error(error);
});
```

もし 名前が "`Poochiru`" で始まる Linking デバイスが 5 秒で見つかれば、`Array` オブジェクトが `resolve()` 関数に引き渡されます。その `Array` オブジェクトには、見つかったデバイスを表す [`LinkingDevice`](#LinkingDevice-object) オブジェクトが含まれています。詳細は "[`LinkingDevice`](#LinkingDevice-object) オブジェクト" の章をご覧ください。

もしすぐにレスポンスが欲しい場合は、`quick` プロパティに `true` をセットすることができます。

```JavaScript
linking.init().then(() => {
  return linking.discover({
    duration: 5000,
    idFilter: 'edcbe4062d8',
    quick: true
  });
}).then((device_list) => {
  // Do something...
}).catch((error) => {
  console.error(error);
});
```

この場合は、事前にデバイスの ID を知っていることを前提としています。`quick` プロパティに `true` をセットすると、`duration` プロパティの値に関わらず、対象のデバイスが発見された直後に `resolve()` 関数が呼び出されます。

### <a id="Linking-ondiscover-event-handler">`ondiscover` イベントハンドラ</a>

[`Linking`](#Linking-object) オブジェクトの `ondiscover` プロパティは、発見プロセスでデバイスが新たに見つかるたびに呼び出されるイベントハンドラです。`ondiscover` プロパティにセットされたコールバック関数には [`LinkingDevice`](#LinkingDevice-object) オブジェクトが引き渡されます。

```JavaScript
linking.init().then(() => {
  linking.ondiscover = (device) => {
    let ad = device.advertisement;
    console.log('- ' + ad.id + ': ' + ad.localName);
    console.log('---------------------------------------');
  };
  return linking.discover({
    duration: 10000
  });
}).then((device_list) => {
  console.log('The discovery process was finished.');
  console.log(device_list.length + ' devices were found.');
  process.exit();
}).catch((error) => {
  console.error(error);
});
```

上記コードは、次のような結果を出力します：

```JavaScript
- edcbe4062d81: Tomoru00 02410
---------------------------------------
- da498d14138b: Furueru0098348
---------------------------------------
- c80077af0fb4: Linking Board01 00195
---------------------------------------
- d22ef3a4b7b0: Pochiru02 00313
---------------------------------------
The discovery process was finished.
4 devices were found.
```

### <a id="Linking-startScan-method">scartScan(*[params]*) メソッド</a>

`startScan()` メソッドは、Linking デバイスからのアドバタイジングパケットのスキャンを開始します。このメソッドは `Promise` オブジェクトを返します。このメソッドは、次のパラメータを含んだハッシュオブジェクトを引数に取ります：

プロパティ    | 型     | 必須 | 説明
:------------|:-------|:-----|:------------
`nameFilter` | String | 任意 | この値がセットされると、名前 (`localName`) が指定のキーワードで始るデバイスからのアドバタイジングパケットのみにフィルターします。
`idFilter`   | String | 任意 | この値がセットされると、ID (`id`) が指定のキーワードで始るデバイスからのアドバタイジングパケットのみにフィルターします。

パケットを受信するたびに、`Linking` オブジェクトの [`onadvertisement`](#Linking-onadvertisement-event-handler) プロパティにセットされたコールバック関数が呼び出されます。パケットを受信すると、そのコールバック関数に [`LinkingAdvertisement`](#LinkingAdvertisement-object) が引き渡されます。

```JavaScript
const Linking = require('node-linking');
const linking = new Linking();

(async () => {
  await linking.init();

  // パケット受信時に呼び出されるコールバック関数をセット
  linking.onadvertisement = (ad) => {
    console.log(JSON.stringify(ad, null, '  '));
  };

  // Linking デバイスからのアドバタイジングパケットのスキャンを開始
  await linking.startScan({
    nameFilter: 'Tukeru'
  });

  // 10 秒待つ
  await linking.wait(10000);

  // スキャンを停止
  await linking.stopScan();
  process.exit();
})();
```

上記のコードは、次のような結果を出力します：

```
{
  "id": "df50d23f1b60",
  "uuid": "df50d23f1b60",
  "address": "df:50:d2:3f:1b:60",
  "localName": "Tukeru_th0164069",
  "serviceUuids": [
    "b3b3690150d34044808d50835b13a6cd"
  ],
  "txPowerLevel": -96,
  "rssi": -67,
  "distance": 0.03548133892335755,
  "version": 0,
  "vendorId": 0,
  "individualNumber": 164069,
  "beaconServiceId": 1,
  "beaconServiceData": {
    "name": "Temperature (°C)",
    "temperature": 25.875
  }
}
{
  "id": "df50d23f1b60",
  "uuid": "df50d23f1b60",
  "address": "df:50:d2:3f:1b:60",
  "localName": "Tukeru_th0164069",
  "serviceUuids": [
    "b3b3690150d34044808d50835b13a6cd"
  ],
  "txPowerLevel": -96,
  "rssi": -66,
  "distance": 0.03162277660168379,
  "version": 0,
  "vendorId": 0,
  "individualNumber": 164069,
  "beaconServiceId": 2,
  "beaconServiceData": {
    "name": "Humidity (%)",
    "humidity": 63
  }
}
```

### <a id="Linking-stopScan-method">stopScan() メソッド</a>

`stopScan()` メソッドは、Linking デバイスからのアドバタイジングパケットのスキャンを停止します。このメソッドは `Promise` オブジェクトを返します。詳細は "[`startScan()` メソッド](#Linking-startScan-method)" の章をご覧ください。

### <a id="Linking-onadvertisement-event-handler">`onadvertisement` イベントハンドラ</a>

`onadvertisement` にコールバック関数がセットされると、スキャンがアクティブな間 (`startScan()` メソッドが呼び出された時点から、`stopScan()` メソッドが呼び出される時点までの間)、Linking デバイスからアドバタイジングパケットを受信するたびに、そのコールバック関数が呼び出されます。

詳細は "[`startScan()` メソッド](#Linking-startScan-method)" の章をご覧ください。

### <a id="Linking-wait-method">`wait()` method</a>

`wait()` メソッドは指定のミリ秒間だけ待ちます。このメソッドは待ち時間を表す整数 (ミリ秒) を引数に取ります。このメソッドは `Promise` オブジェクトを返します。

このメソッドはリンキングデバイスに対して何もしません。これは単なるユーティリティメソッドです。このメソッドの使い方の詳細は "[Quick Start](#Quick-Start)" のセクションをご覧ください。

---------------------------------------
## <a id="LinkingDevice-object">`LinkingDevice` オブジェクト</a>

`LinkingDevice` オブジェクトは、[`Linking`](#Linking-object) オブジェクトの [`discover()`](#Linking-discover-method) メソッドを呼び出すことによって発見された Linking デバイスを表します。

### <a id="LinkingDevice-connect-method">connect() メソッド</a>

`connect()` メソッドは、デバイスとのコネクションを確立 (ペアリング) します。このメソッドは `Promise` オブジェクトを返します。

このメソッドは、どんな種類のデバイスなのか、そして、どんなサービスを提供するのか、などを調査します。その処理には 10 秒ほどかかります。問題なくペアリング処理が完了すれば、`LinkingDevice` オブジェクトの[プロパティ](#LinkingDevice-properties)やメソッドを使って、該当のデバイスの能力を知ることもできますし、該当のデバイスにコマンドを送ることもできます。

以下のコードは、デバイスとの接続を確立し、そのデバイスの名前と対応サービスを表示し、最後に、そのデバイスとの接続を切断します：

```JavaScript
device.connect().then(() => {
  console.log('- Device Name: ' + device.advertisement.localName);
  console.log('- Supported services:');
  Object.keys(device.services).forEach((service_name) => {
    if(device.services[service_name] !== null) {
      console.log('  - ' + service_name);
    }
  });
  return device.disconnect();
}).then(() => {
  console.log('Disconnected');
}).catch((error) => {
  console.error(error);
});
```

結果は次のようになります：

```
- Device Name: Pochiru02 00313
- Supported Services:
  - deviceName
  - battery
  - led
  - button
Disconnected
```

### <a id="LinkingDevice-disconnect-method">disconnect() メソッド</a>

`disconnect()` メソッドは、デバイスとの接続を切断します。このメソッドは `Promise` オブジェクトを返します。詳細は[前の章](#LinkingDevice-connect-method)をご覧ください。

### <a id="LinkingDevice-properties">プロパティ</a>

`LinkingDevice` オブジェクトには以下に挙げられたプロパティが実装されています：

プロパティ       | 型     | 説明
:---------------|:---------|-----------------------------
`advertisement` | [`LinkingAdvertisement`](#LinkingAdvertisement-object) | デバイス発見時に受信したアドバタイジングパケットを表します。詳細は "[`LinkingAdvertisement` オブジェクト](#LinkingAdvertisement-object)" の章をご覧ください。
`connected`     | Boolean  | もしデバイスが接続されていれば、この値は `true` になります。そうでなければ、`false` になります。
`services`      | [`LinkingServices`](#LinkingServices-object) | 詳細は "[`LinkingServices` オブジェクト](#LinkingServices-object)" の章をご覧ください。
[`onconnect`](#LinkingDevice-onconnect-event-handler)     | Function | デバイスが接続されたとき、このプロパティにセットされた関数が呼び出されます。デフォルト値は `null` です。詳細は "[`onconnect` イベントハンドラ](#LinkingDevice-onconnect-event-handler)" の章をご覧ください。
[`ondisconnect`](#LinkingDevice-ondisconnect-event-handler)  | Function | デバイスが切断されたとき、このプロパティにセットされた関数が呼び出されます。デフォルト値は `null` です。詳細は "[`ondisconnect` イベントハンドラ](#LinkingDevice-ondisconnect-event-handler)" の章をご覧ください。

### <a id="LinkingDevice-onconnect-event-handler">`onconnect` イベントハンドラ</a>

`LinkingDevice` オブジェクトの `onconnect` は、デバイスが接続されたときに呼び出されるイベントハンドラです。以下のコードは、`onconnect` イベントハンドラの使い方を示しています：

```JavaScript
// デバイスが接続されたときに呼び出されるコールバック関数をセット
device.onconnect = () => {
  console.log('Connected.');
};

デバイスとの接続の確立を開始
device.connect();
```

実際には、上記コードは下記コードと同じです：

```JavaScript
device.connect().then(() => {
  console.log('Connected.');
});
```

### <a id="LinkingDevice-ondisconnect-event-handler">`ondisconnect` イベントハンドラ</a>

`LinkingDevice` オブジェクトの `ondisconnect` は、デバイスが切断されたときに呼び出されるイベントハンドラです。下記コードは、`ondisconnect` イベントハンドラの使い方を示しています：

```JavaScript
device.ondisconnect = (reason) => {
  console.log('Disconnected.');
  console.dir(reason);
};
```

上記コードは、次のような結果を出力します。

```
Disconnected.
{ wasClean: true }
```

`ondisconnect` にセットされたコールバック関数には、デバイスが切断された理由を表すオブジェクトが引き渡されます。`disconnect()` メソッドが呼び出されると、`wasClean` プロパティの値は `true` になります。そうでなければ、その値は `false` になります。つまり、該当のデバイスは意図せずに切断されたことを意味します。

---------------------------------------
## <a id="LinkingAdvertisement-object">`LinkingAdvertisement` オブジェクト</a>

`LinkingAdvertisement` オブジェクトは、Linking デバイスから来たアドバタイジングデータを表します。このオブジェクトは、次のプロパティを含んだ単なるハッシュオブジェクトです：

```json
{
  "id": "edcbe4062d81",
  "uuid": "edcbe4062d81",
  "address": "ed:cb:e4:06:2d:81",
  "localName": "Tomoru00 02410",
  "serviceUuids": [
    "b3b3690150d34044808d50835b13a6cd"
  ],
  "txPowerLevel": -66,
  "rssi": -59,
  "distance": 0.44668359215096315,
  "companyId": 738,
  "companyName": "NTT docomo",
  "version": 0,
  "vendorId": 0,
  "individualNumber": 2410,
  "beaconDataList": [
    {
      "name": "Pressed button information",
      "buttonId": 2,
      "buttonName": "SingleClick",
      "serviceId": 5
    }
  ]
}
```

いくつかのプロパティは、Linking 独自のデータです：

プロパティ           | 型     | 説明
:-------------------|:-------|:-----------
`distance`          | Number | ホスト (node-linking を実行している) から Linking デバイスまでの距離 (メートル)。
`companyId`         | Number | Bluetooth SIG によって割り当てられた[企業識別子](https://www.bluetooth.com/ja-jp/specifications/assigned-numbers/company-identifiers)。今のところ、すべての Linking デバイスでは `783` (NTT docomo) がセットされているようです。
`companyName`       | String | 企業識別子に対応する企業名。("NTT docomo" または "Unknown")
`version`           | Number | Linking バージョン番号。現時点では、Linking プロファイルはこのプロパティを使っておらず、仕様では将来のために使うと言っています。今のところ、すべての Linking デバイスでは `0` がセットされているようです。
`vendorId`          | Number | Linking プロジェクトによって付与されたベンダー識別子。今のところ、すべての Linking デバイスでは `0` がセットされているようです。
`individualNumber`  | Number | 個々のデバイスのユニーク番号。
`beaconDataList`    | Array  | Linking のビーコンのサービスデータのリスト。それぞれのビーコンサービスデータの構造は後述の `serviceId` に依存します。

### 一般サービス (serviceId: `0`)

```json
  "beaconDataList": [
    {
      "name": "General",
      "serviceId": 0
    }
  ]
```

このサービスは、アドバタイジングデータの中に意味のある情報は何も提供されていない、ということを意味します。

### 温度サービス (serviceId: `1`)

```json
  "beaconDataList": [
    {
      "name": "Temperature (°C)",
      "temperature": 26.75,
      "serviceId": 1
    }
  ]
```

### 湿度サービス (serviceId: `2`)

```json
  "beaconDataList": [
    {
      "name": "Humidity (%)",
      "humidity": 48.375,
      "serviceId": 2
    }
  ]
```

### 大気圧サービス (serviceId: `3`)

```json
  "beaconDataList": [
    {
      "name": "Air pressure (hPa)",
      "pressure": 996,
      "serviceId": 3
    }
  ]
```

### 電池残量サービス (serviceId: `4`)

```json
  "beaconDataList": [
    {
      "name": "Remaining battery power (Threshold value or less)",
      "chargeRequired": false,
      "chargeLevel": 0,
      "serviceId": 4
    }
  ]
```

プロパティ        | 型      |説明
:----------------|:--------|:-----------
`chargeRequired` | Boolean | 充電要否を表します。値が `true` なら、充電が必要という意味になります。値が `false` なら、充電は不要という意味になります。
`chargeLevel`    | Number  | 電池残量 (%)

このサービスをサポートした Linking デバイスはどれも、上記のサンプルと同じ結果を報告するようです。つまり、`required` は常に `false` で、`level` は常に `0` です。このサービスがうまく機能しているか良く分かりません。

### ボタン押下情報サービス (serviceId: `5`)

```json
  "beaconDataList": [
    {
      "name": "Pressed button information",
      "buttonId": 2,
      "buttonName": "SingleClick",
      "serviceId": 5
    }
  ]
```

プロパティ        | 型      |説明
:------------|:--------|:-----------
`buttonId`   | Number  | ボタン種別またはボタンアクションを表すボタン ID。
`buttonName` | String  | `buttonId` の意味。

`buttonId` と `buttonName` の組み合わせは以下の通りです：

`buttonId` | `buttonName`
:---------|:----------------------------
`0` | `Power`
`1` | `Return`
`2` | `SingleClick`
`3` | `Home`
`4` | `DoubleClick`
`5` | `VolumeUp`
`6` | `VolumeDown`
`7` | `LongPress`
`8` | `Pause`
`9` | `LongPressRelease`
`10` | `FastForward`
`11` | `ReWind`
`12` | `Shutter`
`13` | `Up`
`14` | `Down`
`15` | `Left`
`16` | `Right`
`17` | `Enter`
`18` | `Menu`
`19` | `Play`
`20` | `Stop`


### 開閉センサー情報サービス (serviceId: `6`)

今のところ、[`Oshieru`](https://linkingiot.com/developer/en/devices.html) だけがこのサービスをサポートしています。しかし、ビーコンデータが暗号化されているようです。どうやら、我々、サードパーティの開発者には、直接的にこのビーコンデータを扱うことは許されていないようです。

### 人感センサー情報サービス (serviceId: `7`)

```json
  "beaconDataList": [
    {
      "name": "Human detection",
      "humanDetectionResponse": true,
      "humanDetectionCount": 199,
      "serviceId": 7
    }
  ]
```

プロパティ                | 型      | 説明
:------------------------|:--------|:-----------
`humanDetectionResponse` | Boolean | 感知フラグ (`true`: 反応あり, `false`: 反応なし)
`humanDetectionCount`    | Number  | 反応ありの回数

### 振動センサー情報サービス (serviceId: `8`)

今のところ、[`Kizuku`](https://linkingiot.com/developer/en/devices.html) だけがこのサービスをサポートしています。しかし、ビーコンデータが暗号化されているようです。どうやら、我々、サードパーティの開発者には、直接的にこのビーコンデータを扱うことは許されていないようです。

### 照度センサー情報サービス (serviceId: `9`)

```json
  "beaconDataList": [
    {
      "name": "Illuminance (lx)",
      "illuminance": 242,
      "serviceId": 9
    }
  ]
```

### ベンダー独自情報サービス (serviceId: `15`)

```json
  "beaconDataList": [
    {
      "name": "Vendor",
      "bin": "000100001000",
      "serviceId": 15
    }
  ]
```

12 ビットのデータです。私たちにこの意味は分かりません。

---------------------------------------
## <a id="LinkingServices-object">`LinkingServices` オブジェクト</a>

`LinkingServices` オブジェクトには、デバイスがペアリングモードでサポートするサービスを表します：

プロパティ       | 型                                                     | 説明
:---------------|:-------------------------------------------------------|:-----------
`deviceName`    | [`LinkingDeviceName`](#LinkingDeviceName-object)       | このオブジェクトはデバイス名サービスを表し、デバイス名を取得したり更新したりすることができます。このサービスはすべての Linking デバイスがサポートしています。
`battery`       | [`LinkingBattery`](#LinkingBattery-object)             | このオブジェクトはバッテリーサービスを表し、バッテリーレベルの変化をモニターすることができます。デバイスがこのサービスをサポートしてない場合、この値は `null` になります。
`led`           | [`LinkingLed`](#LinkingLed-object)                     | このオブジェクトは LED サービスを表し、デバイスの LED を点灯または消灯することができます。デバイスがこのサービスをサポートしてない場合、この値は `null` になります。
`vibration`     | [`LinkingVibration`](#LinkingVibration-object)         | このオブジェクトはバイブレーションサービスを表し、バイブレーションを開始または停止することができます。デバイスがこのサービスをサポートしてない場合、この値は `null` になります。
`button`        | [`LinkingButton`](#LinkingButton-object)               | このオブジェクトはボタンサービスを表し、ボタンの状態の変化をモニターすることができます。デバイスがこのサービスをサポートしてない場合、この値は `null` になります。
`gyroscope`     | [`LinkingGyroscope`](#LinkingGyroscope-object)         | このオブジェクトはジャイロスコープサービスを表し、該当のセンサーデータをモニターすることができます。デバイスがこのサービスをサポートしてない場合、この値は `null` になります。
`accelerometer` | [`LinkingAccelerometer`](#LinkingAccelerometer-object) | このオブジェクトは加速度センサーサービスを表し、該当のセンサーデータをモニターすることができます。デバイスがこのサービスをサポートしてない場合、この値は `null` になります。
`orientation`   | [`LinkingOrientation`](#LinkingOrientation-object)     | このオブジェクトは方位センサーサービスを表し、該当のセンサーデータをモニターすることができます。デバイスがこのサービスをサポートしてない場合、この値は `null` になります。
`temperature`   | [`LinkingTemperature`](#LinkingTemperature-object)     | このオブジェクトは温度センサーサービスを表し、該当のセンサーデータをモニターすることができます。デバイスがこのサービスをサポートしてない場合、この値は `null` になります。
`humidity`      | [`LinkingHumidity`](#LinkingHumidity-object)           | このオブジェクトは湿度センサーサービスを表し、該当のセンサーデータをモニターすることができます。デバイスがこのサービスをサポートしてない場合、この値は `null` になります。
`pressure`      | [`LinkingPressure`](#LinkingPressure-object)           | このオブジェクトは大気圧センサーサービスを表し、該当のセンサーデータをモニターすることができます。デバイスがこのサービスをサポートしてない場合、この値は `null` になります。
`illuminance`      | [`LinkingIlluminance`](#LinkingIlluminance-object)           | このオブジェクトは照度センサーサービスを表し、該当のセンサーデータをモニターすることができます。デバイスがこのサービスをサポートしてない場合、この値は `null` になります。

それぞれのプロパティが `null` かそうでないかをチェックすれば、該当のデバイスがどのサービスをサポートしているのかを知ることができます。以下のコードは、該当のデバイスが温度センサーサービスをサポートしているかをチェックします。

```JavaScript
if(device.services.temperature) {
  console.log('The device supports the temperature service.');
} else {
  console.log('The device does not support the temperature service.');
}
```

デバイスのデータシートにはサポートしていると書かれていても、ペアリングモードではサポートされていない場合がありますので注意してください。たとえば、[データシートでは `Sizuku THA` は大気圧センサーをサポートしていると書かれています](https://linkingiot.com/developer/devices.html)が、ペアリングモードではサポートされていません。実際にはビーコンモードでのみサポートされています。つまり、デバイスが発信しているアドバタイジングデータからでしか、そのセンサー情報を取得することはできません。

---------------------------------------
## <a id="LinkingDeviceName-object">`LinkingDeviceName` オブジェクト</a>

このオブジェクトは、デバイス名の読み書きの API を提供します。

### <a id="LinkingDeviceName-get-method">`get()` メソッド</a>

このメソッドは、デバイスにセットされているデバイス名を読み取ります。

```JavaScript
device.services.deviceName.get().then((res) => {
  console.log(res.deviceName);
}).catch((error) => {
  console.error(error);
});
```

このメソッドが問題なく実行されると、`resolve()` 関数には次のプロパティを含んだハッシュオブジェクトが引き渡されます：

プロパティ    | 型     | 説明
:------------|:-------|:-----------
`deviceName` | String | デバイス名

### <a id="LinkingDeviceName-set-method">`set(deviceName)` メソッド</a>

このメソッドはデバイスにデバイス名を書き込みます。次のように、新たなデバイス名をこのメソッドの第一引数に渡さなければいけません。

```JavaScript
device.services.deviceName.set('New name').then(() => {
  console.log('The new name was set successfully.');
}).catch((error) => {
  console.error(error);
});
```

---------------------------------------
## <a id="LinkingBattery-object">`LinkingBattery` object</a>

このオブジェクトは、バッテリー状態を見る API を提供します。

### <a id="LinkingBattery-start-method">`start()` メソッド</a>

このメソッドは、バッテリー状態の変化の監視を開始します。

```JavaScript
device.services.battery.onnotify = (res) => {
  console.log(JSON.stringify(res, null, '  '));
};

device.services.battery.start().then((res) => {
  if(res.resultCode === 0) {
    console.log('Started to watch the changes of the battery status.');
  } else {
    console.error(res.resultCode + ': ' + res.resultText);
  }
}).catch((error) => {
  console.error(error);
});
```

`start()` メソッドを呼び出す前に、[`onnotify`](#LinkingBattery-onnotify-property) プロパティにコールバック関数をセットしなければいけません。

このメソッドは `Promise` オブジェクトを返します。デバイスから応答があると、`resolve()` 関数が呼び出され、[`LinkingResponse`](#LinkingResponse-object) オブジェクトが引き渡されます。

たとえ、`resolve()` 関数が呼び出されたとしても、必ずしもリクエストが成功したとは限らない点に注意してください。[`LinkingResponse`](#LinkingResponse-object) オブジェクトの `resultCode` の値をチェックすることをお勧めします。

上記コードは次のような結果を出力します：

```JavaScript
{
  chargeRequired: true,
  chargeLevel: 0
}
```

上記コードをご覧の通り、`resolve()` 関数には、次のプロパティを含んだハッシュオブジェクトが引き渡されます：

プロパティ        | 型      | 説明
:----------------|:--------|:-----------
`chargeRequired` | Boolean | 充電要否を表します。値が `true` なら、充電が必要という意味になります。値が `false` なら、充電は不要という意味になります。
`chargeLevel`    | Number  | 電池残量 (%)

今のところ、このリクエストに対して通知を返してくれるのは `Sizuku 6X` だけのようです。しかし、`chargeRequired` は常に `true`、`chargeLevel` は常に `0` になります。このサービスがうまく機能しているか良く分かりません。

### <a id="LinkingBattery-onnotify-property">`onnotify` プロパティ</a>

`start()` メソッドを呼び出した後、デバイスから通知が来るたびに、`onnotify` プロパティにセットされたコールバック関数が呼び出されます。

### <a id="LinkingBattery-stop-method">`stop()` method</a>

このメソッドは、バッテリー状態変化の監視を停止します。

```JavaScript
device.services.battery.stop().then(() => {
  console.log('Stopped');
}).catch((error) => {
  console.error(error);
});
```

---------------------------------------
## <a id="LinkingLed-object">`LinkingLed` オブジェクト</a>

このオブジェクトは、デバイスの LED を点灯または消灯する API を提供します。

### <a id="LinkingLedColors-object">`LinkingLedColors` プロパティ</a>

このプロパティは、LED の対応色を `Array` オブジェクトで表します。

```JavaScript
console.dir(device.services.led.colors);
```

上記コードは次のような結果を出力します：

```JavaScript
{ Red: 1, Green: 2 }
```

それぞれのプロパティ名は色の名前を意味し、それぞれの値は色コードを意味します。これらの値は、[`turnOn()`](#LinkingLed-start-method) メソッドを使う際に必要になります。

### <a id="LinkingLedPatterns-object">`LinkingLedPatterns` プロパティ</a>

このプロパティは、LED の対応パターンを `Array` オブジェクトで表します。

```JavaScript
console.dir(device.services.led.patterns);
```

上記コードは次のような結果を出力します：

```JavaScript
{ OFF: 1,
  Pattern1: 2,
  Pattern2: 3,
  Pattern3: 4,
  Pattern4: 5,
  Pattern5: 6,
  Pattern6: 7 }
```

それぞれのプロパティ名はパターンの名前を意味し、それぞれの値はパターンコードを意味します。これらの値は、[`turnOn()`](#LinkingLed-start-method) メソッドを使う際に必要になります。

### <a id="LinkingLed-turnOn-method">`turnOn([colorName[, patternName[, duration]]])` メソッド</a>

このメソッドは、指定の色とパターンで LED を点灯します。

```JavaScript
device.services.led.turnOn('Red', 'Pattern2', 30).then((res) => {
  if(res.resultCode === 0) {
    console.log('The LED was turned on successfully.');
  } else {
    console.error(res.resultCode + ': ' + res.resultText);
  }
}).catch((error) => {
  console.error(error);
})
```

`colorName` と `patternName` が省略されたら、自動的に対応の色とパターンの一つを適用します。

もしパラメータ `duration` が省略されたら、自動的に `5` (秒) がセットされます。Linking プロファイルは `0`, `5`, `10`, `30`, `60`, `180` (秒) のいずれか一つを受け付けます。それ以外の値が指定されたら、受け付け可能な値から、指定した値に最も近い値を自動的に適用します。

このメソッドは `Promise` オブジェクトを返します。デバイスからレスポンスが来たら、`resolve()` 関数が呼び出され、[`LinkingResponse`](#LinkingResponse-object) が引き渡されます。

たとえ、`resolve()` 関数が呼び出されたとしても、必ずしもリクエストが成功したとは限らない点に注意してください。[`LinkingResponse`](#LinkingResponse-object) オブジェクトの `resultCode` の値をチェックすることをお勧めします。

### <a id="LinkingLed-turnOff-method">`turnOff()` メソッド</a>

このメソッドはデバイスの LED を消灯します。

```JavaScript
device.services.led.turnOff().then((res) => {
  if(res.resultCode === 0) {
    console.log('The LED was turned off successfully.');
  } else {
    console.error(res.resultCode + ': ' + res.resultText);
  }
}).catch((error) => {
  console.error(error);
})
```

このメソッドは `Promise` オブジェクトを返します。デバイスからレスポンスが来ると、`resolve()` 関数が呼び出され、[`LinkingResponse`](#LinkingResponse-object) オブジェクトが引き渡されます。

たとえ、`resolve()` 関数が呼び出されたとしても、必ずしもリクエストが成功したとは限らない点に注意してください。[`LinkingResponse`](#LinkingResponse-object) オブジェクトの `resultCode` の値をチェックすることをお勧めします。

---------------------------------------
## <a id="LinkingVibration-object">`LinkingVibration` オブジェクト</a>

このオブジェクトは、バイブレーションの開始と停止の API を提供します。

### <a id="LinkingVibrationPatterns-object">`LinkingVibrationPatterns` プロパティ</a>

このプロパティは、対応パターンを `Array` オブジェクトで表します。

```JavaScript
console.dir(device.services.led.patterns);
```

上記コードは、次のような結果を出力します：

```JavaScript
{ OFF: 1,
  Pattern1: 2,
  Pattern2: 3,
  Pattern3: 4,
  Pattern4: 5,
  Pattern5: 6,
  Pattern6: 7,
  Pattern7: 8 }
```

それぞれのプロパティ名はパターンの名前を意味し、それぞれの値はパターンコードを意味します。これらの値は、[`turnOn()`](#LinkingVibration-start-method) メソッドを使う際に必要になります。

### <a id="LinkingVibration-turnOn-method">`turnOn([patternName[, duration]]])` メソッド</a>

このメソッドは、指定のパターンでデバイスのバイブレーションを開始します。

```JavaScript
device.services.vibration.turnOn('Pattern2', 5).then((res) => {
  if(res.resultCode === 0) {
    console.log('The device is vibrating successfully.');
  } else {
    console.error(res.resultCode + ': ' + res.resultText);
  }
}).catch((error) => {
  console.error(error);
})
```


`patternName` が省略されたら、自動的に対応パターンの一つを適用します。

もしパラメータ `duration` が省略されたら、自動的に `5` (秒) がセットされます。Linking プロファイルは `0`, `5`, `10`, `30`, `60`, `180` (秒) のいずれか一つを受け付けます。それ以外の値が指定されたら、受け付け可能な値から、指定した値に最も近い値を自動的に適用します。

このメソッドは `Promise` オブジェクトを返します。デバイスからレスポンスが来たら、`resolve()` 関数が呼び出され、[`LinkingResponse`](#LinkingResponse-object) が引き渡されます。

たとえ、`resolve()` 関数が呼び出されたとしても、必ずしもリクエストが成功したとは限らない点に注意してください。[`LinkingResponse`](#LinkingResponse-object) オブジェクトの `resultCode` の値をチェックすることをお勧めします。

### <a id="LinkingVibration-turnOff-method">`turnOff()` メソッド</a>

このメソッドはバイブレーションを停止します。

```JavaScript
device.services.vibration.turnOff().then((res) => {
  if(res.resultCode === 0) {
    console.log('The vibration was stopped successfully.');
  } else {
    console.error(res.resultCode + ': ' + res.resultText);
  }
}).catch((error) => {
  console.error(error);
})
```

このメソッドは `Promise` オブジェクトを返します。デバイスからレスポンスが来たら、`resolve()` 関数が呼び出され、[`LinkingResponse`](#LinkingResponse-object) が引き渡されます。

たとえ、`resolve()` 関数が呼び出されたとしても、必ずしもリクエストが成功したとは限らない点に注意してください。[`LinkingResponse`](#LinkingResponse-object) オブジェクトの `resultCode` の値をチェックすることをお勧めします。

---------------------------------------
## <a id="LinkingButton-object">`LinkingButton` オブジェクト</a>

このオブジェクトは、デバイスのボタンアクションを開始する API を提供します。

### <a id="LinkingButton-onnotify-property">`onnotify` プロパティ</a>

`onnotify` プロパティは、デバイスでボタンアクションが発生するたびに呼び出されるイベントハンドラです。

```JavaScript
device.services.button.onnotify = (res) => {
  console.log('- Button action: ' + res.buttonName + ' (' + res.buttonId + ')');
};
```

上記コードは、次のような結果を出力します：

```JavaScript
- Button action: SingleClick (2)
- Button action: DoubleClick (4)
- Button action: LongClick (7)
- Button action: LongClickRelease (9)
```

---------------------------------------
## <a id="LinkingGyroscope-object">`LinkingGyroscope` object</a>

このオブジェクトは、デバイスのジャイロスコープによって報告されたデータを監視する API を提供します。

### <a id="LinkingGyroscope-start-method">`start()` method</a>

このメソッドは、デバイスのジャイロスコープによって報告されたデータの監視を開始します。

```JavaScript
device.services.gyroscope.onnotify = (res) => {
  console.log('x: ' + res.x + ', y: ' + res.y + ', z: ' + res.z);
};

device.services.gyroscope.start().then((res) => {
  if(res.resultCode === 0) {
    console.log('Started to watch the data from the gyroscope.');
  } else {
    console.error(res.resultCode + ': ' + res.resultText);
  }
}).catch((error) => {
  console.error(error);
});
```

`start()` メソッドを呼び出す前に、[`onnotify`](#LinkingGyroscope-onnotify-property) プロパティにコールバック関数をセットしなければいけません。

このメソッドは `Promise` オブジェクトを返します。デバイスからレスポンスが来たら、`resolve()` 関数が呼び出され、[`LinkingResponse`](#LinkingResponse-object) が引き渡されます。

たとえ、`resolve()` 関数が呼び出されたとしても、必ずしもリクエストが成功したとは限らない点に注意してください。[`LinkingResponse`](#LinkingResponse-object) オブジェクトの `resultCode` の値をチェックすることをお勧めします。

上記コードは、次のような結果を出力します：

```JavaScript
x: 0.7012194991111755, y: 0.9756097793579102, z: -0.12195122241973877
x: 0.6707317233085632, y: 1.097561001777649, z: 0.21341463923454285
x: 0.6402438879013062, y: 1.1585365533828735, z: 0.18292683362960815
```

上記コードを見て分かる通り、次のプロパティを含んだオブジェクトが `resolve()` 関数に引き渡されます：

プロパティ | 型  | 説明
:--------|:-------|:------------
`x`      | Number | X 軸の回転速度
`y`      | Number | Y 軸の回転速度
`z`      | Number | Z 軸の回転速度

Linking プロファイル仕様はそれぞれの値の単位を定めていません。私がいくつかのデバイスで試した限り、単位は `deg/sec` と思われます。

"Board for apps developers" のジャイロスコープは [BOSCH BMI160](https://www.bosch-sensortec.com/bst/products/all_products/bmi160) です。その[データシート](https://ae-bst.resource.bosch.com/media/_tech/media/datasheets/BST-BMI160-DS000-07.pdf)によると、その単位は `deg/sec` です。"Sizuku 6X" のジャイロスコープは [InvenSense MPU-6500](https://www.invensense.com/products/motion-tracking/6-axis/mpu-6500/) のようです。その[データシート](https://www.invensense.com/wp-content/uploads/2015/02/MPU-6500-Datasheet2.pdf)によると、その単位も `deg/sec` です。これらのデバイスは、Linking プロファイルにジャイロスコープからの報告データをそのまま載せているものと思われます。

### <a id="LinkingGyroscope-onnotify-property">`onnotify` プロパティ</a>

`start()` メソッドを呼び出した後、デバイスから通知が来るたびに、`onnotify` プロパティにセットされたコールバック関数が呼び出されます。

### <a id="LinkingGyroscope-stop-method">`stop()` メソッド</a>

このメソッドは、デバイスのジャイロスコープによって報告されるデータの監視を停止します。

```JavaScript
device.services.gyroscope.stop().then(() => {
  console.log('Stopped');
}).catch((error) => {
  console.error(error);
});
```

### <a id="LinkingGyroscope-get-method">`get()` メソッド</a>

このメソッドは、デバイスのジャイロスコープによって報告された最新のデータを取得します。

```javascript
device.services.gyroscope.get().then((res) => {
  console.log(JSON.stringify(res, null, '  '));
}).catch((error) => {
  console.error(error);
});
```

このメソッドの実行が成功したら、`resolve()` 関数に次のプロパティを含むオブジェクトが引き渡されます。

プロパティ | 型     | 説明
:---------|:-------|:------------
`x`       | Float  | X 軸の回転速度
`y`       | Float  | Y 軸の回転速度
`z`       | Float  | Z 軸の回転速度

```json
{
  "x": 159.16159057617188,
  "y": -32.82012176513672,
  "z": -5.487804889678955
}
```

---------------------------------------
## <a id="LinkingAccelerometer-object">`LinkingAccelerometer` オブジェクト</a>

このオブジェクトは、デバイスの加速度センサーによって報告されるデータを監視する API を提供します。

### <a id="LinkingAccelerometer-start-method">`start()` method</a>

このメソッドは、デバイスの加速度センサーによって報告されるデータの監視を開始します。

```JavaScript
device.services.accelerometer.onnotify = (res) => {
  console.log('x: ' + res.x + ', y: ' + res.y + ', z: ' + res.z);
};

device.services.accelerometer.start().then((res) => {
  if(res.resultCode === 0) {
    console.log('Started to watch the data from the accelerometer.');
  } else {
    console.error(res.resultCode + ': ' + res.resultText);
  }
}).catch((error) => {
  console.error(error);
});
```

`start()` メソッドを呼び出す前に、[`onnotify`](#LinkingAccelerometer-onnotify-property) プロパティにコールバック関数をセットしなければいけません。

このメソッドは `Promise` オブジェクトを返します。デバイスからレスポンスが来たら、`resolve()` 関数が呼び出され、[`LinkingResponse`](#LinkingResponse-object) が引き渡されます。

たとえ、`resolve()` 関数が呼び出されたとしても、必ずしもリクエストが成功したとは限らない点に注意してください。[`LinkingResponse`](#LinkingResponse-object) オブジェクトの `resultCode` の値をチェックすることをお勧めします。

上記コードは、次のような結果を出力します：

```JavaScript
x: -0.008999999612569809, y: -0.05299999937415123, z: 1
x: -0.007000000216066837, y: -0.052000001072883606, z: 1.0010000467300415
x: -0.008999999612569809, y: -0.05299999937415123, z: 1.003999948501587
```

上記コードを見て分かる通り、次のプロパティを含んだオブジェクトが `resolve()` 関数に引き渡されます：

プロパティ | 型  | 説明
:--------|:-------|:------------
`x`      | Number | X 軸の加速度
`y`      | Number | Y 軸の加速度
`z`      | Number | Z 軸の加速度

Linking プロファイル仕様はそれぞれの値の単位を定めていません。私がいくつかのデバイスで試した限り、単位は重力込みの `G` と思われます。なぜなら、デバイスが静止した状態のとき、`z` プロパティの値がちょうど `1.0` だからです。

"Board for apps developers" の加速度センサーは [BOSCH BMI160](https://www.bosch-sensortec.com/bst/products/all_products/bmi160) です。その[データシート](https://ae-bst.resource.bosch.com/media/_tech/media/datasheets/BST-BMI160-DS000-07.pdf)によると、その単位は `G` です。"Sizuku 6X" の加速度センサーは [InvenSense MPU-6500](https://www.invensense.com/products/motion-tracking/6-axis/mpu-6500/) のようです。その[データシート](https://www.invensense.com/wp-content/uploads/2015/02/MPU-6500-Datasheet2.pdf)によると、その単位は `G` です。"BLEAD-TSH-LK" にも加速度センサーがありますが、それが何かは分かりませんでした。いずれにせよ、これらのデバイスは、Linking プロファイルに加速度センサーからの報告データをそのまま載せているものと思われます。

### <a id="LinkingAccelerometer-onnotify-property">`onnotify` プロパティ</a>

`start()` メソッドを呼び出した後、デバイスから通知が来るたびに、`onnotify` プロパティにセットされたコールバック関数が呼び出されます。

### <a id="LinkingAccelerometer-stop-method">`stop()` method</a>

このメソッドは、デバイスの加速度センサーによって報告されるデータの監視を停止します。

```JavaScript
device.services.accelerometer.stop().then(() => {
  console.log('Stopped');
}).catch((error) => {
  console.error(error);
});
```

### <a id="LinkingAccelerometer-get-method">`get()` メソッド</a>

このメソッドは、デバイスの加速度センサーによって報告された最新のデータを取得します。


```javascript
device.services.accelerometer.get().then((res) => {
  console.log(JSON.stringify(res, null, '  '));
}).catch((error) => {
  console.error(error);
});
```

このメソッドの実行が成功したら、`resolve()` 関数に次のプロパティを含むオブジェクトが引き渡されます。

プロパティ | 型     | 説明
:---------|:-------|:------------
`x`       | Float  | X 軸の加速度
`y`       | Float  | Y 軸の加速度
`z`       | Float  | Z 軸の加速度

```json
{
  "x": -0.03200000151991844,
  "y": 0.004000000189989805,
  "z": 1.024999976158142
}
```

---------------------------------------
## <a id="LinkingOrientation-object">`LinkingOrientation` オブジェクト</a>

このオブジェクトは、デバイスの方位センサーによって報告されるデータを監視する API を提供します。

### <a id="LinkingOrientation-start-method">`start()` method</a>

このメソッドは、デバイスの方位センサーによって報告されるデータの監視を開始します。

```JavaScript
device.services.orientation.onnotify = (res) => {
  console.log('x: ' + res.x + ', y: ' + res.y + ', z: ' + res.z);
};

device.services.orientation.start().then((res) => {
  if(res.resultCode === 0) {
    console.log('Started to watch the data from the orientation sensor.');
  } else {
    console.error(res.resultCode + ': ' + res.resultText);
  }
}).catch((error) => {
  console.error(error);
});
```

`start()` メソッドを呼び出す前に、[`onnotify`](#LinkingOrientation-onnotify-property) プロパティにコールバック関数をセットしなければいけません。

このメソッドは `Promise` オブジェクトを返します。デバイスからレスポンスが来たら、`resolve()` 関数が呼び出され、[`LinkingResponse`](#LinkingResponse-object) が引き渡されます。

たとえ、`resolve()` 関数が呼び出されたとしても、必ずしもリクエストが成功したとは限らない点に注意してください。[`LinkingResponse`](#LinkingResponse-object) オブジェクトの `resultCode` の値をチェックすることをお勧めします。

上記コードは、次のような結果を出力します：

```JavaScript
x: 1.128000020980835, y: 0.2849999964237213, z: 1.559000015258789
x: 1.128999948501587, y: 0.289000004529953, z: 1.5709999799728394
x: 1.128999948501587, y: 0.289000004529953, z: 1.5709999799728394
```

上記コードを見て分かる通り、次のプロパティを含んだオブジェクトが `resolve()` 関数に引き渡されます：

プロパティ | 型  | 説明
:--------|:-------|:------------
`x`      | Number | X 軸の回転角度
`y`      | Number | Y 軸の回転角度
`z`      | Number | Z 軸の回転角度

Linking プロファイル仕様はそれぞれの値の単位を定めていません。"Board for apps developers" の方位センサー (地磁気センサー) は STMicroelectronics LIS3MDL](http://www.st.com/en/mems-and-sensors/lis3mdl.html) です。その[データシート](http://www.st.com/resource/en/datasheet/lis3mdl.pdf)によると、その単位は `gauss` です。しかし、Linking プロファイルを通してデバイスから送られてくる値の単位は定かではありません。

### <a id="LinkingOrientation-onnotify-property">`onnotify` プロパティ</a>

`start()` メソッドを呼び出した後、デバイスから通知が来るたびに、`onnotify` プロパティにセットされたコールバック関数が呼び出されます。

### <a id="LinkingOrientation-stop-method">`stop()` メソッド</a>

このメソッドは、デバイスの方位センサーによって報告されるデータの監視を停止します。

```JavaScript
device.services.orientation.stop()).then(() => {
  console.log('Stopped');
}).catch((error) => {
  console.error(error);
});
```

### <a id="LinkingOrientation-get-method">`get()` メソッド</a>

このメソッドは、デバイスの方位センサーによって報告された最新のデータを取得します。

```javascript
device.services.orientation.get().then((res) => {
  console.log(JSON.stringify(res, null, '  '));
}).catch((error) => {
  console.error(error);
});
```

このメソッドの実行が成功したら、`resolve()` 関数に次のプロパティを含むオブジェクトが引き渡されます。

プロパティ | 型     | 説明
:---------|:-------|:------------
`x`       | Float  | X 軸の回転角度
`y`       | Float  | Y 軸の回転角度
`z`       | Float  | Z 軸の回転角度

```json
{
  "x": 2.049999952316284,
  "y": -0.7599999904632568,
  "z": 0.550000011920929
}
```

---------------------------------------
## <a id="LinkingTemperature-object">`LinkingTemperature` オブジェクト</a>

このオブジェクトは、デバイスの温度センサーによって報告されるデータを監視する API を提供します。

### <a id="LinkingTemperature-start-method">`start()` メソッド</a>

このメソッドは、デバイスの温度センサーによって報告されるデータの監視を開始します。

```JavaScript
device.services.temperature.onnotify = (res) => {
  console.log(res.temperature + ' °C');
};

device.services.temperature.start().then((res) => {
  if(res.resultCode === 0) {
    console.log('Started to watch the data from the temperature sensor.');
  } else {
    console.error(res.resultCode + ': ' + res.resultText);
  }
}).catch((error) => {
  console.error(error);
});
```

`start()` メソッドを呼び出す前に、[`onnotify`](#LinkingTemperature-onnotify-property) プロパティにコールバック関数をセットしなければいけません。

このメソッドは `Promise` オブジェクトを返します。デバイスからレスポンスが来たら、`resolve()` 関数が呼び出され、[`LinkingResponse`](#LinkingResponse-object) が引き渡されます。

たとえ、`resolve()` 関数が呼び出されたとしても、必ずしもリクエストが成功したとは限らない点に注意してください。[`LinkingResponse`](#LinkingResponse-object) オブジェクトの `resultCode` の値をチェックすることをお勧めします。

上記コードは、次のような結果を出力します：

```JavaScript
25.125 °C
```

上記コードを見て分かる通り、次のプロパティを含んだオブジェクトが `resolve()` 関数に引き渡されます：

プロパティ | 型  | 説明
:-------------|:-------|:------------
`temperature` | Number | 温度 (°C)

### <a id="LinkingTemperature-onnotify-property">`onnotify` プロパティ</a>

`start()` メソッドを呼び出した後、デバイスから通知が来るたびに、`onnotify` プロパティにセットされたコールバック関数が呼び出されます。

### <a id="LinkingTemperature-stop-method">`stop()` method</a>

このメソッドは、デバイスの温度センサーによって報告されるデータの監視を停止します。

```JavaScript
device.services.temperature.stop().then(() => {
  console.log('Stopped');
}).catch((error) => {
  console.error(error);
});
```

---------------------------------------
## <a id="LinkingHumidity-object">`LinkingHumidity` オブジェクト</a>

このオブジェクトは、デバイスの湿度センサーによって報告されるデータを監視する API を提供します。

### <a id="LinkingHumidity-start-method">`start()` メソッド</a>

このメソッドは、デバイスの湿度センサーによって報告されるデータの監視を開始します。

```JavaScript
device.services.humidity.onnotify = (res) => {
  console.log(res.humidity + ' %');
};

device.services.humidity.start().then((res) => {
  if(res.resultCode === 0) {
    console.log('Started to watch the data from the humidity sensor.');
  } else {
    console.error(res.resultCode + ': ' + res.resultText);
  }
}).catch((error) => {
  console.error(error);
});
```

`start()` メソッドを呼び出す前に、[`onnotify`](#LinkingHumidity-onnotify-property) プロパティにコールバック関数をセットしなければいけません。

このメソッドは `Promise` オブジェクトを返します。デバイスからレスポンスが来たら、`resolve()` 関数が呼び出され、[`LinkingResponse`](#LinkingResponse-object) が引き渡されます。

たとえ、`resolve()` 関数が呼び出されたとしても、必ずしもリクエストが成功したとは限らない点に注意してください。[`LinkingResponse`](#LinkingResponse-object) オブジェクトの `resultCode` の値をチェックすることをお勧めします。

上記コードは、次のような結果を出力します：

```JavaScript
49.875 %
```

上記コードを見て分かる通り、次のプロパティを含んだオブジェクトが `resolve()` 関数に引き渡されます：

プロパティ | 型  | 説明
:-------------|:-------|:------------
`humidity`    | Number | 湿度 (%)

### <a id="LinkingHumidity-onnotify-property">`onnotify` プロパティ</a>

`start()` メソッドを呼び出した後、デバイスから通知が来るたびに、`onnotify` プロパティにセットされたコールバック関数が呼び出されます。

### <a id="LinkingHumidity-stop-method">`stop()` method</a>

このメソッドは、デバイスの湿度センサーによって報告されるデータの監視を停止します。

```JavaScript
device.services.humidity.stop().then(() => {
  console.log('Stopped');
}).catch((error) => {
  console.error(error);
});
```

---------------------------------------
## <a id="LinkingPressure-object">`LinkingPressure` オブジェクト</a>

このオブジェクトは、デバイスの大気圧センサーによって報告されるデータを監視する API を提供します。

今のところ、このサービスをサポートするデバイスはありません。もし大気圧センサーによって報告されるデータを取り出したいなら、[`startScan()`](#Linking-startScan-method) メソッドを使って、アドバタイジングデータをスキャンしてください。

### <a id="LinkingPressure-start-method">`start()` メソッド</a>

このメソッドは、デバイスの大気圧センサーによって報告されるデータの監視を開始します。


```JavaScript
device.services.pressure.onnotify = (res) => {
  console.log(res.pressure + ' hPa');
};

device.services.pressure.start().then((res) => {
  if(res.resultCode === 0) {
    console.log('Started to watch the data from the air pressure sensor.');
  } else {
    console.error(res.resultCode + ': ' + res.resultText);
  }
}).catch((error) => {
  console.error(error);
});
```

`start()` メソッドを呼び出す前に、[`onnotify`](#LinkingPressure-onnotify-property) プロパティにコールバック関数をセットしなければいけません。

このメソッドは `Promise` オブジェクトを返します。デバイスからレスポンスが来たら、`resolve()` 関数が呼び出され、[`LinkingResponse`](#LinkingResponse-object) が引き渡されます。

たとえ、`resolve()` 関数が呼び出されたとしても、必ずしもリクエストが成功したとは限らない点に注意してください。[`LinkingResponse`](#LinkingResponse-object) オブジェクトの `resultCode` の値をチェックすることをお勧めします。

上記コードは、次のような結果を出力します：

```JavaScript
1008 hPa
```

上記コードを見て分かる通り、次のプロパティを含んだオブジェクトが `resolve()` 関数に引き渡されます：

プロパティ | 型  | 説明
:-------------|:-------|:------------
`pressure`    | Number | 大気圧 (hPa)

### <a id="LinkingPressure-onnotify-property">`onnotify` プロパティ</a>

`start()` メソッドを呼び出した後、デバイスから通知が来るたびに、`onnotify` プロパティにセットされたコールバック関数が呼び出されます。

### <a id="LinkingPressure-stop-method">`stop()` method</a>

このメソッドは、デバイスの大気圧センサーによって報告されるデータの監視を停止します。


```JavaScript
device.services.pressure.stop().then(() => {
  console.log('Stopped');
}).catch((error) => {
  console.error(error);
});
```

---------------------------------------
## <a id="LinkingHuman-object">`LinkingHuman` オブジェクト</a>

このオブジェクトは、デバイスのモーション (人感) センサーによって報告されるデータを監視する API を提供します。

今のところ、このサービスをサポートしているのは [Oruto](https://store.braveridge.com/products/detail/44) のみです。ただし、Oruto でこのサービスを使うためには事前に BLE ペアリングを必要としますので注意してください。

このサービスの報告頻度は、アドバタイジングデータより低いです。もしより正確な状態を必要とするのであれば、[`startScan()`](#Linking-startScan-method) メソッドを使ってアドバタイジングデータをスキャンすることを推奨します。

### <a id="LinkingHuman-start-method">`start()` メソッド</a>

このメソッドは、デバイスのモーションセンサーによって報告されるデータの監視を開始します。

```JavaScript
device.services.human.onnotify = (res) => {
  console.log(JSON.stringify(res, null, '  '));
};

device.services.human.start().then((res) => {
  if(res.resultCode === 0) {
    console.log('Started to watch the data from the motion sensor.');
  } else {
    console.error(res.resultCode + ': ' + res.resultText);
  }
}).catch((error) => {
  console.error(error);
});
```

`start()` メソッドを呼び出す前に、[`onnotify`](#LinkingHuman-onnotify-property) プロパティにコールバック関数をセットしなければいけません。

このメソッドは `Promise` オブジェクトを返します。デバイスからレスポンスが来たら、`resolve()` 関数が呼び出され、[`LinkingResponse`](#LinkingResponse-object) が引き渡されます。

たとえ、`resolve()` 関数が呼び出されたとしても、必ずしもリクエストが成功したとは限らない点に注意してください。[`LinkingResponse`](#LinkingResponse-object) オブジェクトの `resultCode` の値をチェックすることをお勧めします。

上記コードは、次のような結果を出力します：

```JavaScript
{
  "humanDetectionResponse": true,
  "humanDetectionCount": 1475
}
```

上記コードを見て分かる通り、次のプロパティを含んだオブジェクトが `resolve()` 関数に引き渡されます：

プロパティ                 | 型    | 説明
:------------------------|:--------|:------------
`humanDetectionResponse` | Boolean | 検知フラグ
`humanDetectionCount`    | Integer | 検知カウンター (0 - 2047)

### <a id="LinkingHuman-onnotify-property">`onnotify` プロパティ</a>

`start()` メソッドを呼び出した後、デバイスから通知が来るたびに、`onnotify` プロパティにセットされたコールバック関数が呼び出されます。

### <a id="LinkingHuman-stop-method">`stop()` メソッド</a>

このメソッドは、デバイスのモーションセンサーによって報告されるデータの監視を停止します。

```JavaScript
device.services.human.stop().then(() => {
  console.log('Stopped');
}).catch((error) => {
  console.error(error);
});
```

---------------------------------------
## <a id="LinkingIlluminance-object">`LinkingIlluminance` オブジェクト</a>

このオブジェクトは、デバイスの照度センサーによって報告されるデータを監視する API を提供します。

### <a id="LinkingIlluminance-start-method">`start()` メソッド</a>

このメソッドは、デバイスの照度センサーによって報告されるデータの監視を開始します。


```JavaScript
device.services.illuminance.onnotify = (res) => {
  console.log(res.illuminance + ' lux');
};

device.services.illuminance.start().then((res) => {
  if(res.resultCode === 0) {
    console.log('Started to watch the data from the air illuminance sensor.');
  } else {
    console.error(res.resultCode + ': ' + res.resultText);
  }
}).catch((error) => {
  console.error(error);
});
```

`start()` メソッドを呼び出す前に、[`onnotify`](#LinkingIlluminance-onnotify-property) プロパティにコールバック関数をセットしなければいけません。

このメソッドは `Promise` オブジェクトを返します。デバイスからレスポンスが来たら、`resolve()` 関数が呼び出され、[`LinkingResponse`](#LinkingResponse-object) が引き渡されます。

たとえ、`resolve()` 関数が呼び出されたとしても、必ずしもリクエストが成功したとは限らない点に注意してください。[`LinkingResponse`](#LinkingResponse-object) オブジェクトの `resultCode` の値をチェックすることをお勧めします。

上記コードは、次のような結果を出力します：

```JavaScript
109.23485 lux
```

上記コードを見て分かる通り、次のプロパティを含んだオブジェクトが `resolve()` 関数に引き渡されます：

プロパティ | 型  | 説明
:-------------|:-------|:------------
`illuminance` | Number | 照度 (lux)

### <a id="LinkingIlluminance-onnotify-property">`onnotify` プロパティ</a>

`start()` メソッドを呼び出した後、デバイスから通知が来るたびに、`onnotify` プロパティにセットされたコールバック関数が呼び出されます。

### <a id="LinkingIlluminance-stop-method">`stop()` method</a>

このメソッドは、デバイスの照度センサーによって報告されるデータの監視を停止します。


```JavaScript
device.services.illuminance.stop().then(() => {
  console.log('Stopped');
}).catch((error) => {
  console.error(error);
});
```

---------------------------------------
## <a id="LinkingResponse-object">`LinkingResponse` オブジェクト</a>

このオブジェクトはデバイスからの応答を表します。このオブジェクトは次のプロパティを持ちます：

プロパティ    | 型     | 説明
:------------|:-------|:-----------
`resultCode` | Number | この値が `0` なら、リクエストが問題なく受け付けられたことを意味します。この値が `0` でないなら、リクエストは受け付けられなかったことを意味します。
`resultText` | String | `resultCode` に対応したメッセージです。

`resultCode` と `resultText` の組み合わせは以下の通りです：

`resultCode` | `resultText`
:------------|:------------
`0`          | `OK, request processed correctly`
`1`          | `Cancel`
`2`          | `Error, failed`
`3`          | `Error, no reason defined`
`4`          | `Error, data not available`
`5`          | `Error, not supported`

---------------------------------------
## <a id="Supported-devices">対応デバイス</a>

node-linking は次のデバイスで動作することを確認しています：

* [株式会社Braveridge](https://ssl.braveridge.com/)
  * [Board for apps developers](https://store.braveridge.com/products/detail/26)
  * [Tomoru](https://store.braveridge.com/products/detail/43)
  * [Pochiru](https://store.braveridge.com/products/detail/28)
  * [Sizuku LED](https://store.braveridge.com/products/detail/31)
  * [Sizuku THA](https://store.braveridge.com/products/detail/32)
  * [Sizuku 6X](https://store.braveridge.com/products/detail/33)
  * [Tukeru TH](https://store.braveridge.com/products/detail/34)
  * [Furueru](https://store.braveridge.com/products/detail/36)
  * [Pochiru(eco)](https://store.braveridge.com/products/detail/37)
  * [Tomoru フルカラー](https://store.braveridge.com/products/detail/40)
  * [Sizuku Lux](https://store.braveridge.com/products/detail/41)
  * [Oruto](https://store.braveridge.com/products/detail/44)
  * [Tobasu THI](https://store.braveridge.com/products/detail/45)

* [SEMITEC株式会社](http://www.semitec.co.jp/)
  * [WT-S2](https://semitec-shop.com/category/select/cid/596/pid/10913/language/ja/currency/JPY)

Braveridge 社が [Oshieru](https://ssl.braveridge.com/store/html/products/detail.php?product_id=39) と [Kizuku](https://ssl.braveridge.com/store/html/products/detail.php?product_id=38) も販売していますが、BLE データが非公開の暗号化方式で暗号化されているため、node-linking はこれらのデバイスをサポートしていません。

---------------------------------------
## <a id="Release-Note">リリースノート</a>
* v1.0.0 (2021-04-13)
  * このモジュール全体を `async`, `await` 等のモダンな構文で書き直しました。
  * [`scartScan()`](#Linking-startScan-method) と [`stopScan()`](#Linking-stopScan-method) は `Promise` オブジェクトを返すようになりました。
  * [`wait()`](#Linking-wait-method) メソッドを新たに追加しました。
  * [`connect()`](#LinkingDevice-connect-method) メソッドのデバイス接続の安定化を図りました。
* v0.5.0 (2021-04-02)
  * [`LinkingHuman`](#LinkingHuman-object) オブジェクトを追加しました。
  * [対応デバイス](#Supported-devices)に [Tobasu THI](https://store.braveridge.com/products/detail/45) と [WT-S2](https://semitec-shop.com/category/select/cid/596/pid/10913/language/ja/currency/JPY) を追加しました。
* v0.4.1 (2020-02-19)
  * BLE 接続の安定性を向上しました。
* v0.4.0 (2019-11-03)
  * 新製品の [Oruto](https://ssl.braveridge.com/store/html/products/detail.php?product_id=44) をサポートしました (アドバタイジングパケットのスキャンのみ)。
  * [`LinkingGyroscope`](#LinkingGyroscope-object), [`LinkingAccelerometer`](#linkingaccelerometer-object), そして [`LinkingOrientation`](#linkingorientation-object) オブジェクトに `get()` メソッドを追加しました。
  * [`connect()`](#LinkingDevice-connect-method) メソッドの処理にタイムアウト機構を追加しました。
  * [ボタン押下情報サービス (serviceId: `5`) の `buttonId` と `buttonName` の対応](#pressed-button-information-service-serviceid-5)を更新しました。いくつかの ID が追加され、いくつかの名前が変更されました (`LongClick` -> `LongPress`, `LongClickRelease` -> `LongPressRelease`)。
* v0.3.0 (2019-10-24)
  * [@abandonware/noble](https://github.com/abandonware/noble) を採用することで、Node v8 以降をサポートしました。
  * [`Buffer`](https://nodejs.org/api/buffer.html) に関連した廃止予定のコードを更新しました。これによって、このモジュールによって Node v10 以降で警告が出力されることがなくなりました。
* v0.2.0 (2018-09-16)
  * Supported illuminance service to monitor the sensor data.
* v0.1.0 (2018-06-06)
  * Supported new Linking device `Sizuku Lux`.
  * Supported the Illumination sensor information Service (serviceId: 9) and the Vendor-specific information Service (serviceId: 15) in beacons.
* v0.0.2 (2017-09-02)
  * Fixed a bug that an exception was thrown when an unknown packet came.
* v0.0.1 (2017-07-02)
  * First public release

---------------------------------------
## <a id="References">リファレンス</a>

* [Project Linking (ユーザー向け)](https://linkingiot.com/index.html)
* [Project Linking (開発者向け)](https://linkingiot.com/developer/index.html)
* [Linking デバイス](https://linkingiot.com/developer/devices.html)
* [Linking API ガイド](https://linkingiot.com/developer/api.html)

---------------------------------------
## <a id="License">ライセンス</a>

The MIT License (MIT)

Copyright (c) 2017-2021 Futomi Hatano

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
