"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRef, useState } from "react";
import savePoll from "./actions";

export default function Page() {
    const selectRef = useRef(null);
    const [inputCount, setInputCount] = useState(2);
    const [errors, setErrors] = useState("");

    const arr = [];
    for (let i = 1; i <= inputCount; i++) {
        arr.push(i);
    }
    const handleSubmit = async (formdata: FormData) => {
        setErrors("");

        const res = await savePoll(formdata);
        console.log("SENT FORM TO SERVER: ", res);
        if (typeof res === "string") {
            setErrors(res);
        }
    };
    return (
        <div className="grid w-full items-center justify-center">
            {errors && <p className="text-xs text-red-400">{errors}</p>}
            <div>CREATE PAGE</div>

            <form className="grid gap-4 border p-4" action={handleSubmit}>
                <div>
                    <Label htmlFor="title">Poll title</Label>
                    <Input id="title" name="title" type="text" required />
                </div>
                <div>
                    <Label htmlFor="option-count">
                        Total number of poll options:
                    </Label>
                    <select
                        onChange={(e) => setInputCount(Number(e.target.value))}
                        ref={selectRef}
                        name="option-count"
                        id="option-count"
                    >
                        <option value="2">2</option>
                        <option value="3">3</option>
                        <option value="4">4</option>
                    </select>
                </div>
                <div>
                    {arr.map((cnt) => {
                        return (
                            <div key={cnt}>
                                <Label htmlFor={"option-" + cnt}>
                                    Option {cnt}
                                </Label>
                                <Input
                                    name={"option" + cnt}
                                    id={"option" + cnt}
                                    type="text"
                                    required
                                />
                            </div>
                        );
                    })}
                </div>
                <Button type="submit">Create</Button>
            </form>
        </div>
    );
}
