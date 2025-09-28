import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
	{
		user: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		text: {
			type: String,
		},
		img: {
			type: String,
		},
		basicAnalysis: {
			sentiment: {
				score: {
					type: Number,
					default: 0
				},
				label: {
					type: String,
					enum: ['positive', 'negative', 'neutral'],
					default: 'neutral'
				}
			},
			contextLabel: {
				type: String,
				enum: ['good_news', 'bad_news', 'neutral'],
				default: 'neutral'
			},
			isFlagged: {
				type: Boolean,
				default: false
			}
		},
		llmAnalysis: {
			sentiment: {
				type: String,
				enum: ['positive', 'negative', 'neutral'],
				default: 'neutral'
			},
			sentiment_score: {
				type: Number,
				default: 0
			},
			topics: [{
				type: String
			}],
			content_warnings: [{
				type: String
			}],
			summary: {
				type: String,
				default: ""
			},
			api_status: {
				type: String,
				default: "Success"
			}
		},
		likes: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "User",
			},
		],
		comments: [
			{
				text: {
					type: String,
					required: true,
				},
				user: {
					type: mongoose.Schema.Types.ObjectId,
					ref: "User",
					required: true,
				},
				basicAnalysis: {
					sentiment: {
						score: {
							type: Number,
							default: 0
						},
						label: {
							type: String,
							enum: ['positive', 'negative', 'neutral'],
							default: 'neutral'
						}
					},
					contextLabel: {
						type: String,
						enum: ['good_news', 'bad_news', 'neutral'],
						default: 'neutral'
					},
					isFlagged: {
						type: Boolean,
						default: false
					}
				},
				llmAnalysis: {
					sentiment: {
						type: String,
						enum: ['positive', 'negative', 'neutral'],
						default: 'neutral'
					},
					sentiment_score: {
						type: Number,
						default: 0
					},
					topics: [{
						type: String
					}],
					content_warnings: [{
						type: String
					}],
					summary: {
						type: String,
						default: ""
					},
					api_status: {
						type: String,
						default: "Success"
					}
				}
			},
		],
	},
	{ timestamps: true }
);

const Post = mongoose.model("Post", postSchema);

export default Post;
