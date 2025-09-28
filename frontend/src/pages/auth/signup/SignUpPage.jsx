import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";

import XSvg from "../../../components/svgs/X";

import { MdOutlineMail } from "react-icons/md";
import { FaUser } from "react-icons/fa";
import { MdPassword } from "react-icons/md";
import { MdDriveFileRenameOutline } from "react-icons/md";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

const SignUpPage = () => {
	const [formData, setFormData] = useState({
		email: "",
		username: "",
		fullName: "",
		password: "",
		userType: "patient"
	});

	const queryClient = useQueryClient();
	const navigate = useNavigate();

	const { mutate, isError, isPending, error } = useMutation({
		mutationFn: async ({ email, username, fullName, password, userType }) => {
			try {
				const res = await fetch("/api/auth/signup", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ email, username, fullName, password, userType }),
				});

				const data = await res.json();
				if (!res.ok) throw new Error(data.error || "Failed to create account");
				return data;
			} catch (error) {
				console.error(error);
				throw error;
			}
		},
		onSuccess: (data) => {
			toast.success("Account created successfully");
			queryClient.invalidateQueries({ queryKey: ["authUser"] });
			
			// Handle redirection based on user type
			if (data.userType === "radiologist") {
				window.location.href = "http://localhost:8501";
			} else {
				navigate("/");
			}
		},
	});

	const handleSubmit = (e) => {
		e.preventDefault();
		mutate(formData);
	};

	const handleInputChange = (e) => {
		setFormData({ ...formData, [e.target.name]: e.target.value });
	};

	return (
		<div className="relative w-full h-screen flex items-center justify-center">
			{/* Background Image with Blur Effect */}
			<div
				className="absolute inset-0 bg-cover bg-center opacity-70"
				style={{ backgroundImage: "url('/bg-cancer.jpg')", backgroundSize: "cover" }}
			></div>

			<div className="relative z-10 max-w-screen-xl mx-auto flex h-screen">
				<div className="flex-1 hidden lg:flex items-center justify-center">
					{/* <XSvg className="lg:w-2/3 fill-white" /> */}
				</div>
				<div className="flex-1 flex flex-col justify-center items-center">
					<form className="flex gap-4 flex-col" onSubmit={handleSubmit}>
						<XSvg className="w-24 lg:hidden fill-pink-500" />
						<h1 className="text-4xl font-extrabold text-white">Join Hope Community</h1>
						<label className="input input-bordered rounded flex items-center gap-2">
							<MdOutlineMail />
							<input
								type="email"
								className="grow"
								placeholder="Email"
								name="email"
								onChange={handleInputChange}
								value={formData.email}
							/>
						</label>
						<div className="flex gap-4 flex-wrap">
							<label className="input input-bordered rounded flex items-center gap-2 flex-1">
								<FaUser />
								<input
									type="text"
									className="grow"
									placeholder="Username"
									name="username"
									onChange={handleInputChange}
									value={formData.username}
								/>
							</label>
							<label className="input input-bordered rounded flex items-center gap-2 flex-1">
								<MdDriveFileRenameOutline />
								<input
									type="text"
									className="grow"
									placeholder="Full Name"
									name="fullName"
									onChange={handleInputChange}
									value={formData.fullName}
								/>
							</label>
						</div>
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
							{isPending ? "Creating..." : "Sign up"}
						</button>
						{isError && <p className="text-red-500">{error.message}</p>}
					</form>
					<div className="flex flex-col gap-2 mt-4">
						<p className="text-white text-lg">Already have an account?</p>
						<Link to="/login">
							<button className="btn rounded-full btn-primary text-white btn-outline w-full">
								Sign in
							</button>
						</Link>
					</div>
				</div>
			</div>
		</div>
	);
};
export default SignUpPage;
