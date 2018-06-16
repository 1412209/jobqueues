const kafka = require("kafka-node")

const kafkaServer = "localhost:9092";
const topicExec = "topic_exec";
const topicInit = "topic_init";

class KafkaManager{
	static Init(done = null){
		done();
	}
	static Connect(done){
		client = new kafka.KafkaClient({kafkaHost: kafkaServer, autoConnect : true});
		done();
	}
	static ListenExec(done){
		var client = new kafka.KafkaClient({kafkaHost: kafkaServer, autoConnect : true});
		var consumer = new kafka.Consumer(
			client,
			[{topic: topicExec}],
			{
				autoCommit: true	// tự động xác nhận đã lấy thông tin 
			}
		);
		consumer.on("message", function(message){
			if (!message) return done(null, null);
			try{
				var value = JSON.parse(message.value);
				return done(null, value);
			} catch(e){
				return done(e, null)
			}
		});
	}
	static ListenInit(done){
		var client = new kafka.KafkaClient({kafkaHost: kafkaServer, autoConnect : true});
		var consumer = new kafka.Consumer(
			client,
			[{topic: topicInit}],
			{
				autoCommit: true	// tự động xác nhận đã lấy thông tin 
			}
		);
		consumer.on("message", function(message){
			if (!message) return done(null, null);
			try{
				var value = JSON.parse(message.value);
				return done(null, value);
			} catch(e){
				return done(e, null)
			}
		});

	}
}
module.exports = KafkaManager;