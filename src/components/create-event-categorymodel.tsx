import { useQueryClient } from "@tanstack/react-query";
import { PropsWithChildren, useState } from "react"
import  {useForm} from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod";

const EVENT_CATEGORY_VALIDATOR = z.object({

})

export const CreateEventCategoryModel = ({children}: PropsWithChildren) => {
    const [isOpen, setIsOpen] = useState(false);
    const queryClient = useQueryClient();

    const { } = useForm({
        resolver: zodResolver()
    })
}