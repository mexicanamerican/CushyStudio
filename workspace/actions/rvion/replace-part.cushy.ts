action('🎭 replace', {
    author: 'rvion',
    help: 'replace a part with anothoer one', // <- action help text
    priority: 1,
    ui: (form) => ({
        inpainting: form.enum({
            enumName: 'Enum_CheckpointLoaderSimple_Ckpt_name',
            default: 'Deliberate-inpainting.safetensors',
        }),
        query: form.str({ default: 'face' }),
        replacement: form.str({ default: 'orc face' }),
        image: form.selectImage('test'),
        norm: form.bool({ label: 'normalize', default: true }),
        threeshold: form.int({ default: 2 }),
    }),
    run: async (flow, reqs) => {
        const image = await flow.loadImageAnswer(reqs.image)
        const clothesMask = flow.nodes.MasqueradeMaskByText({
            image: image,
            prompt: reqs.query,
            negative_prompt: reqs.query,
            normalize: reqs.norm ? 'yes' : 'no',
            precision: reqs.threeshold / 10,
        })

        const maskedLatent2 = flow.nodes.VAEEncodeForInpaint({
            mask: (m) => m.MasqueradeImageToMask({ image: clothesMask.IMAGE, method: 'intensity' }),
            pixels: image,
            vae: flow.AUTO,
            grow_mask_by: 0,
        })
        const inpaintingModel = flow.nodes.CheckpointLoaderSimple({ ckpt_name: reqs.inpainting })
        const sampler = flow.nodes.KSampler({
            seed: flow.randomSeed(),
            steps: 30,
            cfg: 7,
            sampler_name: 'ddim',
            scheduler: 'karras',
            denoise: 0.9,
            model: inpaintingModel,
            positive: flow.nodes.CLIPTextEncode({ text: reqs.replacement, clip: flow.AUTO }),
            negative: flow.nodes.CLIPTextEncode({ text: 'ugly', clip: flow.AUTO }),
            latent_image: maskedLatent2,
        })
        flow.nodes.PreviewImage({ images: flow.nodes.VAEDecode({ samples: sampler, vae: flow.AUTO }) })
        flow.nodes.PreviewImage({ images: clothesMask.IMAGE })
        flow.nodes.PreviewImage({ images: clothesMask.IMAGE_1 })

        // flow.nodes.PreviewImage({ images: clothesMask.IMAGE })
        // flow.nodes.PreviewImage({ images: image })
        // flow.nodes.PreviewImage({ images: clothesMask.IMAGE })
        // flow.nodes.PreviewImage({ images: clothesMask.IMAGE_1 })

        await flow.PROMPT()
    },
})