import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import XSvg from "../../../components/svgs/X";

import { MdOutlineMail } from "react-icons/md";
import { MdPassword } from "react-icons/md";

import { useMutation, useQueryClient } from "@tanstack/react-query";

const LoginPage = () => {
	const [formData, setFormData] = useState({
		username: "",
		password: "",
		userType: "patient"
	});
	const queryClient = useQueryClient();
	const navigate = useNavigate();

	const {
		mutate: loginMutation,
		isPending,
		isError,
		error,
	} = useMutation({
		mutationFn: async ({ username, password, userType }) => {
			const res = await fetch("/api/auth/login", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ username, password, userType }),
			});

			const data = await res.json();

			if (!res.ok) {
				throw new Error(data.error || "Something went wrong");
			}

			return data;
		},
		onSuccess: (data) => {
			queryClient.invalidateQueries({ queryKey: ["authUser"] });
			
			// Handle redirection based on user type
			if (data.userType === "radiologist") {
				window.location.href = "http://localhost:8501";
			} else {
				navigate("/");
			}
		},
		onError: (error) => {
			console.error("Login error:", error);
		}
	});

	const handleSubmit = (e) => {
		e.preventDefault();
		loginMutation(formData);
	};

	const handleInputChange = (e) => {
		setFormData({ ...formData, [e.target.name]: e.target.value });
	};

	return (
		<div className="relative w-full h-screen flex items-center justify-center">
			{/* Background Image (Covers entire screen ) */}
			<div
				className="absolute inset-0 bg-cover bg-center opacity-70"
				style={{ backgroundImage: "url('/bg-cancer.jpg')", backgroundSize: "cover" }}
			></div>

			<div className="relative z-10 max-w-screen-xl mx-auto flex h-screen">
				<div className="flex-1 hidden lg:flex items-center justify-center">
					{/* <XSvg className="lg:w-2/3 fill-white-500" /> */}
				</div>
				<div className="flex-1 flex flex-col justify-center items-center">
					<form className="flex gap-4 flex-col" onSubmit={handleSubmit}>
						<XSvg className="w-24 lg:hidden fill-pink-500" />
						<h1 className="text-4xl font-extrabold text-white">
							Welcome to Hope Community
						</h1>
						<label className="input input-bordered rounded flex items-center gap-2">
							<MdOutlineMail />
							<input
								type="text"
								className="grow"
								placeholder="Username"
								name="username"
								onChange={handleInputChange}
								value={formData.username}
							/>
						</label>

						<label className="input input-bordered rounded flex items-center gap-2">
							<MdPassword />
							<input
								type="password"
								className="grow"
								placeholder="Password"
								name="password"
								onChange={handleInputChange}
								value={formData.password}
							/>
						</label>

						<div className="flex gap-4 justify-center">
							<label className="cursor-pointer flex items-center gap-2">
								<input
									type="radio"
									name="userType"
									value="patient"
									checked={formData.userType === "patient"}
									onChange={handleInputChange}
									className="radio radio-primary"
								/>
								<span className="text-white">Patient</span>
							</label>
							<label className="cursor-pointer flex items-center gap-2">
								<input
									type="radio"
									name="userType"
									value="radiologist"
									checked={formData.userType === "radiologist"}
									onChange={handleInputChange}
									className="radio radio-primary"
								/>
								<span className="text-white">Radiologist</span>
							</label>
						</div>

						<button className="btn rounded-full btn-primary text-white">
							{isPending ? "Loading..." : "Login"}
						</button>
						{isError && <p className="text-red-500">{error.message}</p>}
					</form>
					<div className="flex flex-col gap-2 mt-4">
						<p className="text-white text-lg">{"Don't"} have an account?</p>
						<Link to="/signup">
							<button className="btn rounded-full btn-primary text-white btn-outline w-full">
								Sign up
							</button>
						</Link>
					</div>
				</div>
			</div>
		</div>
	);
};
export default LoginPage;
