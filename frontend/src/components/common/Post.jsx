import { FaRegComment } from "react-icons/fa";
import { BiRepost } from "react-icons/bi";
import { FaRegHeart } from "react-icons/fa";
import { FaRegBookmark } from "react-icons/fa6";
import { FaTrash } from "react-icons/fa";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";

import LoadingSpinner from "./LoadingSpinner";
import { formatPostDate } from "../../utils/date";

// Function to get sentiment color
const getSentimentColor = (sentiment) => {
	if (!sentiment) return 'badge-neutral';
	const label = sentiment.label || sentiment;
	switch (label.toLowerCase()) {
		case 'positive':
			return 'badge-success'; // Green
		case 'negative':
			return 'badge-error';   // Red
		case 'neutral':
			return 'badge-neutral'; // Grey
		default:
			return 'badge-neutral'; // Grey for unknown
	}
};

// Function to format sentiment score
const formatSentimentScore = (score) => {
	if (score === undefined || score === null) return '0.00';
	return typeof score === 'number' ? Math.abs(score).toFixed(2) : '0.00';
};

// Function to get background color for sentiment container
const getSentimentBackground = (sentiment) => {
	if (!sentiment) return 'bg-base-300';
	const label = sentiment.label || sentiment;
	switch (label.toLowerCase()) {
		case 'positive':
			return 'bg-success/10';
		case 'negative':
			return 'bg-error/10';
		default:
			return 'bg-base-300';
	}
};

const Post = ({ post }) => {
	const [comment, setComment] = useState("");
	const { data: authUser } = useQuery({ queryKey: ["authUser"] });
	const queryClient = useQueryClient();
	const postOwner = post.user;
	const isLiked = post.likes.includes(authUser._id);

	const isMyPost = authUser._id === post.user._id;

	const formattedDate = formatPostDate(post.createdAt);

	const { mutate: deletePost, isPending: isDeleting } = useMutation({
		mutationFn: async () => {
			try {
				const res = await fetch(`/api/posts/${post._id}`, {
					method: "DELETE",
				});
				const data = await res.json();

				if (!res.ok) {
					throw new Error(data.error || "Something went wrong");
				}
				return data;
			} catch (error) {
				throw new Error(error);
			}
		},
		onSuccess: () => {
			toast.success("Post deleted successfully");
			queryClient.invalidateQueries({ queryKey: ["posts"] });
		},
	});

	const { mutate: likePost, isPending: isLiking } = useMutation({
		mutationFn: async () => {
			try {
				const res = await fetch(`/api/posts/like/${post._id}`, {
					method: "POST",
				});
				const data = await res.json();
				if (!res.ok) {
					throw new Error(data.error || "Something went wrong");
				}
				return data;
			} catch (error) {
				throw new Error(error);
			}
		},
		onSuccess: (updatedLikes) => {
			queryClient.setQueryData(["posts"], (oldData) => {
				return oldData.map((p) => {
					if (p._id === post._id) {
						return { ...p, likes: updatedLikes };
					}
					return p;
				});
			});
		},
		onError: (error) => {
			toast.error(error.message);
		},
	});

	const { mutate: commentPost, isPending: isCommenting } = useMutation({
		mutationFn: async () => {
			try {
				const res = await fetch(`/api/posts/comment/${post._id}`, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ text: comment }),
				});
				const data = await res.json();

				if (!res.ok) {
					throw new Error(data.error || "Something went wrong");
				}
				return data;
			} catch (error) {
				throw new Error(error);
			}
		},
		onSuccess: () => {
			toast.success("Comment posted successfully");
			setComment("");
			queryClient.invalidateQueries({ queryKey: ["posts"] });
		},
		onError: (error) => {
			toast.error(error.message);
		},
	});

	const handleDeletePost = () => {
		deletePost();
	};

	const handlePostComment = (e) => {
		e.preventDefault();
		if (isCommenting) return;
		commentPost();
	};

	const handleLikePost = () => {
		if (isLiking) return;
		likePost();
	};

	return (
		<>
			<div className='flex gap-2 items-start p-4 border-b border-gray-700'>
				<div className='avatar'>
					<Link to={`/profile/${postOwner.username}`} className='w-8 rounded-full overflow-hidden'>
						<img src={postOwner.profileImg || "/avatar-placeholder.png"} />
					</Link>
				</div>
				<div className='flex flex-col flex-1'>
					<div className='flex gap-2 items-center'>
						<Link to={`/profile/${postOwner.username}`} className='font-bold'>
							{postOwner.fullName}
						</Link>
						<span className='text-gray-700 flex gap-1 text-sm'>
							<Link to={`/profile/${postOwner.username}`}>@{postOwner.username}</Link>
							<span>·</span>
							<span>{formattedDate}</span>
						</span>
						{isMyPost && (
							<span className='flex justify-end flex-1'>
								{!isDeleting && (
									<FaTrash className='cursor-pointer hover:text-red-500' onClick={handleDeletePost} />
								)}

								{isDeleting && <LoadingSpinner size='sm' />}
							</span>
						)}
					</div>
					<div className='flex flex-col gap-3 overflow-hidden'>
						{post.text && <span className="text-base">{post.text}</span>}
						{post.basicAnalysis?.sentiment && (
							<div className={`flex flex-wrap gap-2 mt-2 p-2 rounded-lg ${getSentimentBackground(post.basicAnalysis.sentiment)}`}>
								<span className={`badge ${getSentimentColor(post.basicAnalysis.sentiment)}`}>
									{post.basicAnalysis.sentiment.label}
									{post.basicAnalysis.sentiment.score !== undefined && 
										` (${formatSentimentScore(post.basicAnalysis.sentiment.score)})`
									}
								</span>
								{post.basicAnalysis.contextLabel && (
									<span className="badge badge-ghost">
										{post.basicAnalysis.contextLabel}
									</span>
								)}
								{post.basicAnalysis.isFlagged && (
									<span className="badge badge-warning">
										⚠️ Flagged Content
									</span>
								)}
							</div>
						)}
						{post.llmAnalysis && (
							<div className={`flex flex-col gap-2 mt-2 p-2 rounded-lg ${
								post.llmAnalysis.api_status !== "Success" 
									? 'bg-warning/10' 
									: getSentimentBackground(post.llmAnalysis.sentiment)
							}`}>
								{post.llmAnalysis.api_status !== "Success" ? (
									<div className="flex items-center gap-2">
										<span className="badge badge-warning">⚠️ API Error</span>
										<span className="text-sm text-warning">Using fallback analysis</span>
									</div>
								) : (
									<>
										<div className="flex flex-wrap gap-2">
											<span className={`badge ${getSentimentColor(post.llmAnalysis.sentiment)}`}>
												{post.llmAnalysis.sentiment}
												{post.llmAnalysis.sentiment_score !== undefined && 
													` (${formatSentimentScore(post.llmAnalysis.sentiment_score)})`
												}
											</span>
											{post.llmAnalysis.topics?.length > 0 && (
												<div className="flex flex-wrap gap-1">
													{post.llmAnalysis.topics.map((topic, index) => (
														<span key={index} className="badge badge-info badge-sm">{topic}</span>
													))}
												</div>
											)}
										</div>
										{post.llmAnalysis.content_warnings?.length > 0 && (
											<div className="flex flex-wrap gap-1">
												{post.llmAnalysis.content_warnings.map((warning, index) => (
													<span key={index} className="badge badge-warning badge-sm">⚠️ {warning}</span>
												))}
											</div>
										)}
										{post.llmAnalysis.summary && (
											<p className="text-sm text-base-content/70">
												{post.llmAnalysis.summary}
											</p>
										)}
									</>
								)}
							</div>
						)}
						{post.img && (
							<img
								src={post.img}
								className='h-80 object-contain rounded-lg border border-gray-700'
								alt=''
							/>
						)}
					</div>
					<div className='flex justify-between mt-3'>
						<div className='flex gap-4 items-center w-2/3 justify-between'>
							<div
								className='flex gap-1 items-center cursor-pointer group'
								onClick={() => document.getElementById("comments_modal" + post._id).showModal()}
							>
								<FaRegComment className='w-4 h-4  text-slate-500 group-hover:text-sky-400' />
								<span className='text-sm text-slate-500 group-hover:text-sky-400'>
									{post.comments.length}
								</span>
							</div>
							{/* We're using Modal Component from DaisyUI */}
							<dialog id={`comments_modal${post._id}`} className='modal border-none outline-none'>
								<div className='modal-box rounded border border-gray-600'>
									<h3 className='font-bold text-lg mb-4'>COMMENTS</h3>
									<div className='flex flex-col gap-3 max-h-60 overflow-auto'>
										{post.comments.length === 0 && (
											<p className='text-sm text-slate-500'>
												No comments yet 🤔 Be the first one 😉
											</p>
										)}
										{post.comments.map((comment) => (
											<div key={comment._id} className='flex gap-2 items-start'>
												<div className='avatar'>
													<div className='w-8 rounded-full'>
														<img
															src={comment.user.profileImg || "/avatar-placeholder.png"}
														/>
													</div>
												</div>
												<div className='flex flex-col'>
													<div className='flex items-center gap-1'>
														<span className='font-bold'>{comment.user.fullName}</span>
														<span className='text-gray-700 text-sm'>
															@{comment.user.username}
														</span>
													</div>
													<div className='text-sm'>{comment.text}</div>
													{/* Display comment sentiment analysis */}
													{comment.basicAnalysis?.sentiment && (
														<div className={`flex flex-wrap gap-2 mt-1 p-1 rounded ${getSentimentBackground(comment.basicAnalysis.sentiment)}`}>
															<span className={`badge badge-sm ${getSentimentColor(comment.basicAnalysis.sentiment)}`}>
																{comment.basicAnalysis.sentiment.label}
																{comment.basicAnalysis.sentiment.score !== undefined && 
																	` (${formatSentimentScore(comment.basicAnalysis.sentiment.score)})`
																}
															</span>
															{comment.basicAnalysis.contextLabel && (
																<span className="badge badge-sm badge-ghost">
																	{comment.basicAnalysis.contextLabel}
																</span>
															)}
														</div>
													)}
													{comment.llmAnalysis && (
														<div className={`flex flex-col gap-1 mt-1 p-1 rounded ${
															comment.llmAnalysis.api_status !== "Success"
																? 'bg-warning/10'
																: getSentimentBackground(comment.llmAnalysis.sentiment)
														}`}>
															{comment.llmAnalysis.api_status !== "Success" ? (
																<span className="badge badge-sm badge-warning">⚠️ Using fallback</span>
															) : (
																<div className="flex flex-wrap gap-1">
																	<span className={`badge badge-sm ${getSentimentColor(comment.llmAnalysis.sentiment)}`}>
																		{comment.llmAnalysis.sentiment}
																		{comment.llmAnalysis.sentiment_score !== undefined && 
																			` (${formatSentimentScore(comment.llmAnalysis.sentiment_score)})`
																		}
																	</span>
																	{comment.llmAnalysis.topics?.map((topic, index) => (
																		<span key={index} className="badge badge-info badge-sm">{topic}</span>
																	))}
																	{comment.llmAnalysis.content_warnings?.length > 0 && 
																		comment.llmAnalysis.content_warnings.map((warning, index) => (
																			<span key={index} className="badge badge-warning badge-sm">⚠️ {warning}</span>
																		))
																	}
																</div>
															)}
														</div>
													)}
												</div>
											</div>
										))}
									</div>
									<form
										className='flex gap-2 items-center mt-4 border-t border-gray-600 pt-2'
										onSubmit={handlePostComment}
									>
										<textarea
											className='textarea w-full p-1 rounded text-md resize-none border focus:outline-none  border-gray-800'
											placeholder='Add a comment...'
											value={comment}
											onChange={(e) => setComment(e.target.value)}
										/>
										<button className='btn btn-primary rounded-full btn-sm text-white px-4'>
											{isCommenting ? <LoadingSpinner size='md' /> : "Post"}
										</button>
									</form>
								</div>
								<form method='dialog' className='modal-backdrop'>
									<button className='outline-none'>close</button>
								</form>
							</dialog>
							<div className='flex gap-1 items-center group cursor-pointer'>
								<BiRepost className='w-6 h-6  text-slate-500 group-hover:text-green-500' />
								<span className='text-sm text-slate-500 group-hover:text-green-500'>0</span>
							</div>
							<div className='flex gap-1 items-center group cursor-pointer' onClick={handleLikePost}>
								{isLiking && <LoadingSpinner size='sm' />}
								{!isLiked && !isLiking && (
									<FaRegHeart className='w-4 h-4 cursor-pointer text-slate-500 group-hover:text-pink-500' />
								)}
								{isLiked && !isLiking && (
									<FaRegHeart className='w-4 h-4 cursor-pointer text-pink-500 ' />
								)}

								<span
									className={`text-sm  group-hover:text-pink-500 ${
										isLiked ? "text-pink-500" : "text-slate-500"
									}`}
								>
									{post.likes.length}
								</span>
							</div>
						</div>
						<div className='flex w-1/3 justify-end gap-2 items-center'>
							<FaRegBookmark className='w-4 h-4 text-slate-500 cursor-pointer' />
						</div>
					</div>
				</div>
			</div>
		</>
	);
};
export default Post;
