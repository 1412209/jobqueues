const kafka = require("kafka-node");
const kafkaHost = "localhost:9092";
const topicExec = "topic_exec";
const topicInit = "topic_init";

class KafkaController {
	static Init(done=null) {
		KafkaController.CreateTopic(topicExec, function(err, success){
			done();
		})
	}
	static Connect(done){
		// client = new kafka.KafkaClient({kafkaHost: kafkaHost, autoConnect : false});
		// done();
	}
	static SendSubServerExec(data, done){
		var dataJSON = JSON.stringify(data);

		var client = new kafka.KafkaClient({kafkaHost: kafkaHost, autoConnect : true});
		var producer = new kafka.Producer(client);
		producer.on("ready", function(){
			var payloads = [
				{ topic: topicExec, messages: dataJSON }
			];
			producer.send(payloads, function(err, data){
				if (err) return done(err, null);
				return done(null, true);
			});
		});
	}
	static SendSubServerInit(data, done){
		var dataJSON = JSON.stringify(data);

		var client = new kafka.KafkaClient({kafkaHost: kafkaHost, autoConnect : true});
		var producer = new kafka.Producer(client);
		producer.on("ready", function(){
			var payloads = [
			{ topic: topicInit, messages: dataJSON }
			];
			producer.send(payloads, function(err, data){
				if (err) return done(err, null);
				return done(null, true);
			});
		});
	}
	static CreateTopic(topic, done){
		var client = new kafka.KafkaClient({kafkaHost: kafkaHost, autoConnect : true});
		var producer = new kafka.Producer(client);
		producer.on("ready", function(){
			var payloads = [
				{ topic: topic, messages: "" }
			];
			producer.send(payloads, function(err, data){
				if (err) return done(err, null);
				if (!data) return done(null, false);
				return done(null, true);
			});
		});
	}
}

module.exports = KafkaController;